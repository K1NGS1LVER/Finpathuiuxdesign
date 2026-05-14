import { X, Send, Loader2, Clock, WifiOff } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useFinPathStore } from '@/lib/store';
import { apiFetch } from '@/lib/api';

interface PennyPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'penny';
  text: string;
}

// Loading phrases that rotate while waiting
const LOADING_PHRASES = [
  "Penny is thinking...",
  "Crunching your numbers...",
  "Analyzing your finances...",
  "Looking at your goals...",
  "Checking your budget...",
];

export default function PennyPanel({ open, onClose }: PennyPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'penny', text: "Hi! I'm Penny, your AI finance companion. I can see your full financial profile — ask me anything about your goals, budget, savings strategy, or tax planning!" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Store selectors
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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Rotate loading phrases
  useEffect(() => {
    if (!isLoading) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_PHRASES.length;
      setLoadingPhrase(LOADING_PHRASES[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Check if user has any financial data
    if (!onboarded && income.total === 0) {
      const noDataMsg: Message = {
        id: `penny-${Date.now()}`,
        role: 'penny',
        text: "It looks like you haven't set up your financial profile yet. Complete the onboarding first so I can give you personalized advice based on your real numbers!",
      };
      setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', text: trimmed }, noDataMsg]);
      setInput('');
      return;
    }

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Create abort controller for timeout
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const response = await apiFetch('/api/penny', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          profile: {
            onboarded, income, expenses, debts, savings,
            investments, emergencyFund, goals, healthScore,
            strategy, monthlySurplusReserve,
          },
        }),
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        setMessages(prev => [...prev, {
          id: `penny-${Date.now()}`,
          role: 'penny',
          text: "I'm getting a lot of questions right now! Please wait a moment and try again.",
        }]);
        return;
      }

      if (response.status === 401) {
        setMessages(prev => [...prev, {
          id: `penny-${Date.now()}`,
          role: 'penny',
          text: "Your session expired. Please sign in again to continue.",
        }]);
        return;
      }

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages(prev => [...prev, {
        id: `penny-${Date.now()}`,
        role: 'penny',
        text: data.reply || "I'm having trouble thinking right now. Try again?",
      }]);
    } catch (err: any) {
      clearTimeout(timeout);
      const isTimeout = err?.name === 'AbortError';
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'penny',
        text: isTimeout
          ? "That took too long — my thinking timed out. Try a simpler question, or try again in a moment!"
          : "Oops, I couldn't connect right now. Please check your connection and try again!",
      }]);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, onboarded, income, expenses, debts, savings, investments, emergencyFund, goals, healthScore, strategy, monthlySurplusReserve]);

  const quickSuggestions = onboarded || income.total > 0
    ? ['How am I doing financially?', 'Help me save more', 'Analyze my goals', 'Can I afford a big purchase?']
    : ['What is FinPath?', 'How do I get started?'];

  return (
    <>
      {/* Mobile overlay */}
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
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user' ? 'msg-user' : 'msg-penny'}`}
              >
                {msg.text}
              </div>
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

        {/* Quick suggestion chips */}
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