import { X, Send, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useFinPathStore } from '../../lib/store';

interface PennyPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'penny';
  text: string;
}

export default function PennyPanel({ open, onClose }: PennyPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'penny', text: "Hi! I'm Penny, your AI finance companion. I have full context of your financial profile — ask me anything about your goals, budget, tax savings, or investments!" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the full financial profile for context
  // Use individual selectors to avoid creating new objects every render
  const onboarded = useFinPathStore(s => s.onboarded);
  const income = useFinPathStore(s => s.income);
  const expenses = useFinPathStore(s => s.expenses);
  const debts = useFinPathStore(s => s.debts);
  const savings = useFinPathStore(s => s.savings);
  const investments = useFinPathStore(s => s.investments);
  const emergencyFund = useFinPathStore(s => s.emergencyFund);
  const goals = useFinPathStore(s => s.goals);
  const healthScore = useFinPathStore(s => s.healthScore);
  const plan = useFinPathStore(s => s.plan);
  const chatHistory = useFinPathStore(s => s.chatHistory);
  const currency = useFinPathStore(s => s.currency);
  const lastUpdated = useFinPathStore(s => s.lastUpdated);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/penny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          profile: {
            onboarded, income, expenses, debts, savings,
            investments, emergencyFund, goals, healthScore,
            plan, chatHistory, currency, lastUpdated,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const pennyMsg: Message = {
        id: `penny-${Date.now()}`,
        role: 'penny',
        text: data.reply || "I'm having trouble thinking right now. Try again?",
      };
      setMessages(prev => [...prev, pennyMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'penny',
        text: "Oops, I couldn't connect right now. Please check your connection and try again!",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className="fixed top-0 right-0 h-full w-full md:w-[380px] flex flex-col transition-transform duration-300 z-50 text-[var(--card-foreground)]"
        style={{
          background: 'var(--surface-tint)',
          borderLeft: '1px solid var(--border)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          borderRadius: 0,
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(48px)',
          WebkitBackdropFilter: 'blur(48px)',
        }}
      >
      <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--blue)', color: '#fff' }}>
            P
          </div>
          <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Penny</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--lime)] text-[#050F1C] font-semibold">AI</span>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-hover)]">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={{
                backgroundColor: msg.role === 'user' ? 'var(--lime)' : 'var(--surface-hover)',
                color: msg.role === 'user' ? '#050F1C' : 'var(--card-foreground)',
                fontFamily: 'var(--font-body)',
                border: msg.role === 'penny' ? '1px solid var(--border)' : 'none',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : undefined,
                borderBottomLeftRadius: msg.role === 'penny' ? '4px' : undefined,
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 rounded-2xl flex items-center gap-2 text-sm"
              style={{
                backgroundColor: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                borderBottomLeftRadius: '4px',
              }}
            >
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--blue)' }} />
              <span className="text-[var(--secondary)]">Penny is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestion chips */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {['How am I doing financially?', 'Help me save more', 'Analyze my goals'].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask Penny anything..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl outline-none border border-[var(--border)] focus:border-[var(--lime)] transition-colors disabled:opacity-50"
            style={{ fontFamily: 'var(--font-body)', background: 'var(--surface-tint)', color: 'var(--card-foreground)' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            style={{ backgroundColor: 'var(--blue)', color: '#fff' }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
    </>
  );
}