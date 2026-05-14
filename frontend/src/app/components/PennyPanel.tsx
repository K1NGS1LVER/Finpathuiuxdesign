import { X, Send, Loader2, Wrench } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useFinPathStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { apiFetch } from '@/lib/api';
import { parseSse } from '@/lib/sse';
import ProposalCard, { type Proposal } from './ProposalCard';

interface PennyPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'penny';
  text: string;
  toolCalls?: { name: string; input?: unknown }[];
  proposal?: Proposal;
}

const LOADING_PHRASES = [
  'Penny is thinking...',
  'Crunching your numbers...',
  'Analyzing your finances...',
  'Looking at your goals...',
  'Checking your budget...',
];

const WELCOME: Message = {
  id: 'welcome',
  role: 'penny',
  text:
    "Hi! I'm Penny, your AI finance companion. I can run scenarios on your real numbers and propose changes you approve before anything moves. Ask me anything!",
};

export default function PennyPanel({ open, onClose }: PennyPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [hydratedForUser, setHydratedForUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const userId = useAuthStore(s => s.user?.id ?? null);

  const onboarded = useFinPathStore(s => s.onboarded);
  const income = useFinPathStore(s => s.income);
  const expenses = useFinPathStore(s => s.expenses);
  const debts = useFinPathStore(s => s.debts);
  const savings = useFinPathStore(s => s.savings);
  const investments = useFinPathStore(s => s.investments);
  const emergencyFund = useFinPathStore(s => s.emergencyFund);
  const goals = useFinPathStore(s => s.goals);
  const healthScore = useFinPathStore(s => s.healthScore);
  const strategy = useFinPathStore(s => s.strategy);
  const monthlySurplusReserve = useFinPathStore(s => s.monthlySurplusReserve);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isLoading) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_PHRASES.length;
      setLoadingPhrase(LOADING_PHRASES[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Hydrate chat history on first open per user. Re-runs after sign-out → sign-in.
  useEffect(() => {
    if (!open) return;
    if (hydratedForUser === (userId ?? '__anon__')) return;
    setHydratedForUser(userId ?? '__anon__');
    // Reset to just the welcome on user change so prior user's chat doesn't bleed through.
    setMessages([WELCOME]);
    if (!userId) return;
    (async () => {
      try {
        const r = await apiFetch('/api/chat/history?limit=50');
        if (!r.ok) return;
        const rows: { id: string; role: string; content: string }[] = await r.json();
        if (!Array.isArray(rows) || rows.length === 0) return;
        const restored: Message[] = rows.map(row => ({
          id: row.id,
          role: row.role === 'user' ? 'user' : 'penny',
          text: row.content,
        }));
        setMessages([WELCOME, ...restored]);
      } catch {
        // ignore — chat history is best-effort.
      }
    })();
  }, [open, userId, hydratedForUser]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (!onboarded && income.total === 0) {
      const noDataMsg: Message = {
        id: `penny-${Date.now()}`,
        role: 'penny',
        text:
          "It looks like you haven't set up your financial profile yet. Complete onboarding first so I can give you personalized advice based on your real numbers!",
      };
      setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', text: trimmed }, noDataMsg]);
      setInput('');
      return;
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantId = `penny-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', text: trimmed },
      { id: assistantId, role: 'penny', text: '', toolCalls: [] },
    ]);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await apiFetch('/api/penny/stream', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          profile: {
            onboarded, income, expenses, debts, savings,
            investments, emergencyFund, goals, healthScore,
            strategy, monthlySurplusReserve,
          },
          history: messages
            .filter(m => m.id !== 'welcome' && m.id !== assistantId && !m.proposal && m.text.trim().length > 0)
            .map(m => ({ role: m.role === 'penny' ? 'assistant' : 'user', content: m.text })),
        }),
      });

      if (response.status === 429) {
        setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, text: "I'm getting a lot of questions right now. Try again in a moment." } : m)));
        return;
      }
      if (response.status === 401) {
        setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, text: 'Your session expired. Please sign in again.' } : m)));
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      for await (const ev of parseSse(response)) {
        let data: any;
        try { data = JSON.parse(ev.data); } catch { continue; }
        if (ev.event === 'token') {
          const chunk = String(data);
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, text: m.text + chunk } : m)));
        } else if (ev.event === 'tool_call') {
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, toolCalls: [...(m.toolCalls || []), { name: data.name, input: data.input }] } : m)));
        } else if (ev.event === 'proposal') {
          const prop = data as Proposal;
          setMessages(prev => [...prev, { id: `proposal-${prop.id}`, role: 'penny', text: '', proposal: prop }]);
        } else if (ev.event === 'error') {
          const err = String(data);
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, text: m.text || `Error: ${err}` } : m)));
        } else if (ev.event === 'done') {
          if (data?.reply) {
            setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, text: data.reply } : m)));
          }
        }
      }
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      setMessages(prev => prev.map(m => (m.id === assistantId ? {
        ...m,
        text: isTimeout
          ? "That took too long — my thinking timed out. Try a simpler question, or try again in a moment!"
          : "Oops, I couldn't connect right now. Please check your connection and try again!",
      } : m)));
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, onboarded, income, expenses, debts, savings, investments, emergencyFund, goals, healthScore, strategy, monthlySurplusReserve, messages]);

  const quickSuggestions = onboarded || income.total > 0
    ? ['How am I doing financially?', 'What if I get a 10% raise?', 'Compare avalanche vs snowball', 'Help me save more']
    : ['What is FinPath?', 'How do I get started?'];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[380px] flex flex-col z-50 text-[var(--card-foreground)] transition-all duration-300 penny-panel ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ boxShadow: open ? 'var(--shadow-lg)' : 'none' }}
      >
        <div className="h-14 flex items-center justify-between px-4 border-bottom-sep">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold penny-avatar">
              P
            </div>
            <span className="font-bold font-display-family">Penny</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--on-accent)] font-semibold">AI</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-hover)]" aria-label="Close Penny">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.proposal ? (
                <div className="max-w-[92%] w-full">
                  <ProposalCard proposal={msg.proposal} />
                </div>
              ) : (
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user' ? 'msg-user' : 'msg-penny'}`}
                >
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {msg.toolCalls.map((tc, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--surface-2, var(--neutral-50))', color: 'var(--secondary)' }}
                        >
                          <Wrench size={10} /> {tc.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {msg.text || (msg.toolCalls && msg.toolCalls.length > 0 ? '' : null)}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl flex items-center gap-2 text-sm msg-loading">
                <Loader2 size={14} className="animate-spin text-penny-accent" />
                <span className="text-[var(--secondary)] transition-opacity">{loadingPhrase}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {quickSuggestions.map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors suggestion-chip"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 border-top-sep">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask Penny anything..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl outline-none border border-[var(--border)] focus:border-[var(--accent)] transition-colors disabled:opacity-50 input-surface"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 btn-accent-icon"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
