// ─── Penny AI side panel ───

function Penny({ open, onClose, state }) {
  const [messages, setMessages] = React.useState([
    {
      role: "assistant",
      text: "Hi Aanya! I've been analyzing your plan. You're doing well — your savings rate climbed to 26% this quarter. Want to talk through optimizations?",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const endRef = React.useRef(null);

  React.useEffect(() => {
    endRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [messages, thinking]);

  const suggestions = [
    "Can I afford a ₹15L car?",
    "How do I pay off debt faster?",
    "Am I saving enough for retirement?",
    "Should I prepay my home loan?",
  ];

  const send = async (text) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    try {
      const reply = await window.claude.complete(
        `You are Penny, a warm and concise personal finance assistant inside the FinPath app. The user (Aanya, 28, ₹2.2L/mo income, ₹4.2L savings, 3 active goals incl. Emergency Fund and Japan Trip) asked: "${text}". Reply in 3-5 sentences, plain text, no markdown. Be specific with numbers when relevant.`,
      );
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Based on your current plan, the answer depends on a few factors. Could you tell me more about your timeline and current cash position?",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 90,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 250ms ease",
          backdropFilter: "blur(2px)",
        }}
      />
      <aside
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: 440,
          maxWidth: "92vw",
          zIndex: 100,
          background: "var(--card)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-24px 0 60px rgba(0,0,0,0.15)",
          transform: open ? "translateX(0)" : "translateX(110%)",
          transition: "transform 350ms cubic-bezier(0.22,1,0.36,1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, var(--penny-accent), var(--secondary-accent))",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px var(--accent-glow)",
              }}
            >
              <Icon.Sparkles size={18} />
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "var(--green)",
                border: "2px solid var(--card)",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 700 }}>Penny</p>
            <p style={{ fontSize: 11, color: "var(--tertiary)" }}>
              Your finance copilot · Online
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--surface-hover)",
              color: "var(--secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon.X size={16} />
          </button>
        </div>

        <div
          ref={endRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className="penny-msg-in"
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  background:
                    m.role === "user"
                      ? "var(--accent)"
                      : "var(--surface-hover)",
                  color: m.role === "user" ? "#fff" : "var(--card-foreground)",
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  borderBottomRightRadius: m.role === "user" ? 4 : 14,
                  borderBottomLeftRadius: m.role === "assistant" ? 4 : 14,
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div
              className="penny-msg-in"
              style={{ display: "flex", justifyContent: "flex-start" }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  borderBottomLeftRadius: 4,
                  background: "var(--surface-hover)",
                  display: "flex",
                  gap: 5,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="dot"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {messages.length <= 2 && (
          <div
            style={{
              padding: "0 24px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "var(--tertiary)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 4,
              }}
            >
              Try asking
            </p>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                  textAlign: "left",
                  fontSize: 12.5,
                  color: "var(--secondary)",
                  transition: "all 150ms ease",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            padding: "12px 16px 16px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask Penny anything..."
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--surface-hover)",
              border: "1px solid var(--border)",
              fontSize: 13.5,
              color: "var(--card-foreground)",
              outline: "none",
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: input.trim()
                ? "var(--accent)"
                : "var(--surface-hover)",
              color: input.trim() ? "#fff" : "var(--tertiary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 150ms ease",
            }}
          >
            <Icon.ArrowR size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}

Object.assign(window, { Penny });
