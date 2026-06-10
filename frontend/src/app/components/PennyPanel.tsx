import { X, Send, Loader2, Wrench, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router';
import { useFinPathStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { apiFetch } from '@/lib/api';
import { parseSse } from '@/lib/sse';
import ProposalCard, { type Proposal } from './ProposalCard';

interface PennyPanelProps {
  open: boolean;
  onClose: () => void;
}

const MAX_MESSAGE_CHARS = 4000;

// Belt-and-suspenders: even if the backend ever leaks `<function=…>` fine-tune
// markup into content, never paint it. Mirrors backend penny.py:_FUNCTION_TAG_RE.
const FUNCTION_TAG_RE = /<function=[^>]*>(?:[\s\S]*?<\/function>)?/g;
const stripFunctionTags = (s: string) => s.replace(FUNCTION_TAG_RE, '');

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
  text: "Hi! I'm Penny, your AI finance companion. I can run scenarios on your real numbers and propose changes you approve before anything moves. Ask me anything!",
};

/**
 * Render `**bold**` markdown spans as <strong>. Penny's prompt requires every
 * ₹ amount, %, and month count to be wrapped in bold — this surfaces them
 * visually instead of leaving raw asterisks in the chat.
 * Leaves all other text + line breaks alone (`whitespace-pre-line` handles \n).
 */
function renderBoldMd(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} style={{ color: 'var(--accent-text, var(--accent))' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function PennyPanel({ open, onClose }: PennyPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [hydratedForUser, setHydratedForUser] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const location = useLocation();
  const route = (location.pathname.replace(/^\//, '').split('/')[0] || 'landing').toLowerCase();

  const demoMode = useFinPathStore((s) => s.demoMode ?? false);
  const onboarded = useFinPathStore((s) => s.onboarded);
  const income = useFinPathStore((s) => s.income);
  const expenses = useFinPathStore((s) => s.expenses);
  const debts = useFinPathStore((s) => s.debts);
  const savings = useFinPathStore((s) => s.savings);
  const investments = useFinPathStore((s) => s.investments);
  const emergencyFund = useFinPathStore((s) => s.emergencyFund);
  const goals = useFinPathStore((s) => s.goals);
  const healthScore = useFinPathStore((s) => s.healthScore);
  const strategy = useFinPathStore((s) => s.strategy);
  const monthlySurplusReserve = useFinPathStore((s) => s.monthlySurplusReserve);

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
        const restored: Message[] = rows.map((row) => ({
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
    const trimmed = input.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!trimmed || isLoading) return;

    if (!onboarded && income.total === 0) {
      const noDataMsg: Message = {
        id: `penny-${Date.now()}`,
        role: 'penny',
        text: "It looks like you haven't set up your financial profile yet. Complete onboarding first so I can give you personalized advice based on your real numbers!",
      };
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text: trimmed },
        noDataMsg,
      ]);
      setInput('');
      return;
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantId = `penny-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text: trimmed }]);
    setInput('');
    setIsLoading(true);

    const addOrUpdate = (text: string, toolCalls?: { name: string; input: unknown }[]) =>
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === assistantId);
        if (!exists)
          return [
            ...prev,
            { id: assistantId, role: 'penny' as const, text, toolCalls: toolCalls ?? [] },
          ];
        return prev.map((m) =>
          m.id === assistantId ? { ...m, text, ...(toolCalls ? { toolCalls } : {}) } : m,
        );
      });

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await apiFetch('/api/penny/stream', {
        method: 'POST',
        signal: controller.signal,
        ...(demoMode && { headers: { Authorization: 'Bearer finpath-demo' } }),
        body: JSON.stringify({
          message: trimmed,
          profile: {
            onboarded,
            income,
            expenses,
            debts,
            savings,
            investments,
            emergencyFund,
            goals,
            healthScore,
            strategy,
            monthlySurplusReserve,
          },
          history: messages
            .filter((m) => m.id !== 'welcome' && !m.proposal && m.text.trim().length > 0)
            .map((m) => ({ role: m.role === 'penny' ? 'assistant' : 'user', content: m.text })),
          context: route,
        }),
      });

      if (response.status === 429) {
        addOrUpdate("I'm getting a lot of questions right now. Try again in a moment.");
        return;
      }
      if (response.status === 401) {
        addOrUpdate('Your session expired. Please sign in again.');
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      for await (const ev of parseSse(response)) {
        let data: any;
        try {
          data = JSON.parse(ev.data);
        } catch {
          continue;
        }
        if (ev.event === 'token') {
          const chunk = stripFunctionTags(String(data));
          if (!chunk) continue;
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === assistantId);
            if (!exists)
              return [
                ...prev,
                { id: assistantId, role: 'penny' as const, text: chunk, toolCalls: [] },
              ];
            return prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + chunk } : m));
          });
        } else if (ev.event === 'tool_call') {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === assistantId);
            const tc = { name: data.name, input: data.input };
            if (!exists)
              return [
                ...prev,
                { id: assistantId, role: 'penny' as const, text: '', toolCalls: [tc] },
              ];
            return prev.map((m) =>
              m.id === assistantId ? { ...m, toolCalls: [...(m.toolCalls || []), tc] } : m,
            );
          });
        } else if (ev.event === 'proposal') {
          const prop = data as Proposal;
          setMessages((prev) => [
            ...prev,
            { id: `proposal-${prop.id}`, role: 'penny', text: '', proposal: prop },
          ]);
        } else if (ev.event === 'error') {
          const err = String(data);
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === assistantId);
            if (!exists)
              return [
                ...prev,
                { id: assistantId, role: 'penny' as const, text: err, toolCalls: [] },
              ];
            return prev.map((m) =>
              m.id === assistantId ? { ...m, text: (m.text ? m.text + '\n\n' : '') + err } : m,
            );
          });
        } else if (ev.event === 'done') {
          if (data?.reply) {
            const cleaned = stripFunctionTags(String(data.reply));
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === assistantId);
              if (!exists)
                return [
                  ...prev,
                  { id: assistantId, role: 'penny' as const, text: cleaned, toolCalls: [] },
                ];
              return prev.map((m) => (m.id === assistantId ? { ...m, text: cleaned } : m));
            });
          }
        }
      }
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      const text = isTimeout
        ? 'That took too long — my thinking timed out. Try a simpler question, or try again in a moment!'
        : "Oops, I couldn't connect right now. Please check your connection and try again!";
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === assistantId);
        if (!exists)
          return [...prev, { id: assistantId, role: 'penny' as const, text, toolCalls: [] }];
        return prev.map((m) => (m.id === assistantId ? { ...m, text } : m));
      });
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [
    input,
    isLoading,
    onboarded,
    income,
    expenses,
    debts,
    savings,
    investments,
    emergencyFund,
    goals,
    healthScore,
    strategy,
    monthlySurplusReserve,
    messages,
    route,
  ]);

  const handleClearHistory = useCallback(async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      await apiFetch('/api/chat/history', { method: 'DELETE' });
    } catch {
      // ignore — local clear still happens even if server clear fails.
    } finally {
      setMessages([WELCOME]);
      setShowClearConfirm(false);
      setIsClearing(false);
    }
  }, [isClearing]);

  const quickSuggestions =
    onboarded || income.total > 0
      ? [
          'How am I doing financially?',
          'What if I get a 10% raise?',
          'Compare avalanche vs snowball',
          'Help me save more',
        ]
      : ['What is FinPath?', 'How do I get started?'];

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />}

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
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--on-accent)] font-semibold">
              AI
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={messages.length <= 1 || isLoading}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Clear chat history"
              title="Clear chat history"
            >
              <Trash2 className="icon-wireframe" size={18} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-hover)]"
              aria-label="Close Penny"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {showClearConfirm && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={() => !isClearing && setShowClearConfirm(false)}
          >
            <div
              className="bento-card w-full max-w-[300px] p-5"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="clear-chat-title"
            >
              <h3 id="clear-chat-title" className="text-heading mb-2">
                Clear chat history?
              </h3>
              <p className="text-sm text-[var(--secondary)] mb-4">
                This permanently deletes every message between you and Penny. Can't be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isClearing}
                  className="px-3 py-1.5 rounded-lg text-sm hover:bg-[var(--surface-hover)] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearHistory}
                  disabled={isClearing}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                  style={{ background: 'var(--red)', color: 'var(--on-accent, white)' }}
                >
                  {isClearing ? 'Clearing…' : 'Clear'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
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
                          style={{
                            background: 'var(--surface-2, var(--neutral-50))',
                            color: 'var(--secondary)',
                          }}
                        >
                          <Wrench size={10} /> {tc.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {msg.role === 'penny'
                    ? renderBoldMd(msg.text)
                    : msg.text || (msg.toolCalls && msg.toolCalls.length > 0 ? '' : null)}
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
                onClick={() => {
                  setInput(q);
                }}
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
              onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_CHARS))}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask Penny anything..."
              disabled={isLoading}
              maxLength={MAX_MESSAGE_CHARS}
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
