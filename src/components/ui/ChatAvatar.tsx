// src/components/ui/ChatAvatar.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GamePhase } from "@/hooks/useGamePhase";

type Message = { role: "user" | "assistant"; content: string };

type Props = {
  phase: GamePhase;
  open: boolean;
  onClose: () => void;
  openedByBeacon?: boolean;
};

const MO_SYSTEM_PROMPT = `You are a friendly AI guide on manuramchandani.com — a portfolio site built as a playable WebGL climbing + snowboarding game. You speak on behalf of Manu (Mo) Ramchandani and can answer questions about him, his projects, and his work.

Keep answers concise (2-4 sentences). Be direct and friendly. Don't use bullet points unless the question explicitly asks for a list. If you don't know something, say so honestly.

About Manu:
- 14 years building web products, mobile apps, and AI agent systems
- Based in Pasadena, CA. Currently freelance.
- Projects: Prism (SaaS demo, 15 modules, real integrations), Sleeping Employees (AI bidding agent on a Mac Mini — bids on jobs overnight, publishes a newsletter), LeagueLads (LoL companion, live team comp analysis), Scout (TV/movie discovery with natural-language mood search), Seedling (kids learning app with ASL + AI parent companion), Community (volunteering map app, PostGIS), Meal Planner (receipt scanner → Gemini AI recipes), Workshops (e-learning platform)
- Hobbies: rock climbing, BJJ (10th Planet Pasadena), snowboarding
- Stack: React/TypeScript, React Native, Flutter, Three.js, Supabase, Cloudflare Workers, Claude/Groq/Gemini AI
- Email: manu@manuramchandani.com
- LinkedIn: linkedin.com/in/manuramchandani
- GitHub: github.com/mechanicMo

About this site: a playable WebGL game — climb a real mountain, summit at 4,300m, snowboard down. Built with React Three Fiber + Rapier physics. The mountain is Mo's literal world: rock climbing, snowboarding, and digital tech coexist here — not a metaphor, just how he lives.`;

const BEACON_GREETING =
  "Hey! I'm Beacon — Manu's trail guide up this wall. I can answer anything about him, his work, or this climb. What do you want to know?";

export const ChatAvatar = ({ phase, open, onClose, openedByBeacon = false }: Props) => {
  const [input, setInput]       = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(false);
  const messagesEndRef          = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Beacon greeting on first open via Beacon click
  useEffect(() => {
    if (open && openedByBeacon && messages.length === 0) {
      setMessages([{ role: "assistant", content: BEACON_GREETING }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, openedByBeacon]);

  // phase is available for future context-aware greetings

  const fetchWithTimeout = async (url: string, options: RequestInit) => {
    const timeout = new Promise<never>((_, reject) =>
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
          model: "llama-3.3-70b-versatile",
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
              width: "300px",
              background: "rgba(8,8,16,0.92)",
              border: "1px solid rgba(200,134,10,0.3)",
              borderRadius: "12px",
              overflow: "hidden",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(200,134,10,0.15)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#C8860A", margin: 0, letterSpacing: "0.08em" }}>
                ASK ABOUT MANU
              </p>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(250,248,244,0.4)",
                  cursor: "pointer",
                  fontSize: "16px",
                  lineHeight: 1,
                  padding: "0 4px",
                }}
              >
                x
              </button>
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
                    {m.role === "user" ? "YOU" : "BEACON"}
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
                -&gt;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
