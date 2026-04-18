// src/components/ui/ChatAvatar.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GamePhase } from "@/hooks/useGamePhase";

type Message = { role: "user" | "assistant"; content: string };

type Props = { phase: GamePhase };

const MO_SYSTEM_PROMPT = `You are a friendly AI guide on manuramchandani.com — a portfolio site built as a playable WebGL climbing + snowboarding game. You speak on behalf of Manu (Mo) Ramchandani and can answer questions about him, his projects, and his work.

Keep answers concise (2-4 sentences). Be direct and friendly. Don't use bullet points unless the question explicitly asks for a list. If you don't know something, say so honestly.

About Manu:
- 14 years building web products, mobile apps, and AI agent systems
- Based in Pasadena, CA. Stay-at-home parent + freelancer.
- Projects: Prism (SaaS demo, 15 modules), Sleeping Employees (AI bidding agent), LeagueLads (LoL companion), Scout (TV discovery), Seedling (kids learning app), Community (volunteering map app)
- Hobbies: rock climbing, BJJ at 10th Planet Pasadena, snowboarding, fatherhood
- Stack: React/TypeScript, React Native, Flutter, Three.js, Supabase, Cloudflare, Claude/Groq
- Email: manu@manuramchandani.com

About this site: a playable WebGL game — climb the rock face, summit at y=80, snowboard down. Built with React Three Fiber + Rapier physics. The climb is a metaphor for his career.`;

export const ChatAvatar = ({ phase }: Props) => {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(false);
  const messagesEndRef          = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchWithTimeout = async (url: string, options: any) => {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout (8s)")), 8000)
    );
    return Promise.race([fetch(url, options), timeout]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error("VITE_GROQ_API_KEY not set");

      const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: MO_SYSTEM_PROMPT },
            ...messages,
            userMsg,
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content ?? "Something went wrong.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("[ChatAvatar]", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Couldn't reach the server right now." }]);
    } finally {
      setLoading(false);
    }
  };

  // phase is available for future use (e.g., context-aware prompts)

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 300 }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "absolute",
              bottom: "56px",
              right: 0,
              width: "300px",
              background: "rgba(8,8,16,0.92)",
              border: "1px solid rgba(200,134,10,0.3)",
              borderRadius: "12px",
              overflow: "hidden",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Header */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(200,134,10,0.15)" }}>
              <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#C8860A", margin: 0, letterSpacing: "0.08em" }}>
                ASK ABOUT MANU
              </p>
            </div>

            {/* Messages */}
            <div style={{ height: "240px", overflowY: "auto", padding: "12px 16px" }}>
              {messages.length === 0 && (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "rgba(250,248,244,0.4)", margin: 0, lineHeight: 1.5 }}>
                  Ask me about Manu's projects, background, or what this site is.
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ marginBottom: "12px" }}>
                  <p style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: "10px",
                    color: m.role === "user" ? "#C8860A" : "rgba(250,248,244,0.35)",
                    margin: "0 0 2px",
                    letterSpacing: "0.06em",
                  }}>
                    {m.role === "user" ? "YOU" : "MO"}
                  </p>
                  <p style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "rgba(250,248,244,0.85)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}>
                    {m.content}
                  </p>
                </div>
              ))}
              {loading && (
                <p style={{ fontFamily: "DM Mono, monospace", fontSize: "12px", color: "rgba(200,134,10,0.6)", margin: 0 }}>
                  ...
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(200,134,10,0.15)", display: "flex", gap: "8px" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); send(); } }}
                placeholder="Ask something..."
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(200,134,10,0.2)",
                  borderRadius: "4px",
                  padding: "6px 10px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: "#FAF8F4",
                  outline: "none",
                }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                style={{
                  background: "#C8860A",
                  border: "none",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  fontFamily: "DM Mono, monospace",
                  fontSize: "12px",
                  color: "#FAF8F4",
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading || !input.trim() ? 0.5 : 1,
                }}
              >
                →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "rgba(200,134,10,0.9)",
          border: "1px solid rgba(200,134,10,0.5)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          backdropFilter: "blur(8px)",
        }}
      >
        {open ? "×" : "💬"}
      </motion.button>
    </div>
  );
};
