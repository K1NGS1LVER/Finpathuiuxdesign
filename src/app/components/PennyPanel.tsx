import { X, Send } from 'lucide-react';
import { useState } from 'react';

interface PennyPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function PennyPanel({ open, onClose }: PennyPanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'penny', text: 'Hi! I\'m Penny, your AI finance companion. How can I help you today?' }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }, { role: 'penny', text: 'I can help you with that! This is a demo response.' }]);
    setInput('');
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
        className="fixed top-0 right-0 h-full w-full md:w-[320px] flex flex-col transition-transform duration-300 z-50 bg-[var(--card)] text-[var(--foreground)]"
        style={{
          borderLeft: '1px solid var(--border)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          borderRadius: 0,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
      <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--blue)', color: '#fff' }}>
            P
          </div>
          <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Penny</span>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--border)]">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg ${msg.role === 'penny' ? 'bg-[var(--background-solid)] border border-[var(--border)]' : ''}`}
              style={{
                backgroundColor: msg.role === 'user' ? 'var(--lime)' : undefined,
                color: msg.role === 'user' ? '#050F1C' : 'var(--foreground)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 px-3 py-2 rounded-lg outline-none bg-[var(--background-solid)] border border-[var(--border)] focus:border-[var(--lime)]"
            style={{ fontFamily: 'var(--font-body)' }}
          />
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
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