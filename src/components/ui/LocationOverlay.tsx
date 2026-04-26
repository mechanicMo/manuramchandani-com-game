// src/components/ui/LocationOverlay.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Location } from "@/data/locations";
import type { useAudioManager } from "@/hooks/useAudioManager";

const IS_TOUCH_UI   = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const DISMISS_LABEL = IS_TOUCH_UI ? "dismiss" : "[Enter] dismiss";

// Responsive panel positioning: full-width on mobile (clear of the virtual joystick),
// left-anchored side panel on desktop.
const PANEL_STYLE: React.CSSProperties = IS_TOUCH_UI
  ? { position: "fixed", top: "calc(8px + env(safe-area-inset-top, 0px))", left: "8px", right: "8px", width: "auto", maxHeight: "calc(100vh - 240px)", overflowY: "auto", zIndex: 200 }
  : { position: "fixed", top: "50%", left: "5%", transform: "translateY(-50%)", width: "340px", maxHeight: "90vh", overflowY: "auto", zIndex: 200 };

type Props = {
  location: Location | null;
  onDismiss: () => void;
  audio?: ReturnType<typeof useAudioManager>;
  muted?: boolean;
  onBeginDescent?: () => void;
};

export const LocationOverlay = ({ location, onDismiss, audio, muted = false, onBeginDescent }: Props) => {
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLocRef   = useRef<Location | null>(null);

  useEffect(() => {
    const prevLoc = prevLocRef.current;
    prevLocRef.current = location;

    if (location) {
      const { interactionType } = location;

      // Play panel-open sound for panel/contact/kiosk types
      if ((interactionType === "panel" || interactionType === "contact" || interactionType === "kiosk") && audio && !muted) {
        audio.play("panel-open");
      }

      // Auto-dismiss non-interactive overlays
      if (interactionType === "vignette") {
        timerRef.current = setTimeout(onDismiss, 3000);
      }
      if (interactionType === "marker") {
        timerRef.current = setTimeout(onDismiss, 4000);
      }
      if (interactionType === "view") {
        timerRef.current = setTimeout(onDismiss, 4500);
      }
    } else if (prevLoc) {
      // Play panel-close when a panel/contact/kiosk overlay is dismissed
      const { interactionType } = prevLoc;
      if ((interactionType === "panel" || interactionType === "contact" || interactionType === "kiosk") && audio && !muted) {
        audio.play("panel-close");
      }
    }

    // Dismiss on Escape, or Enter for panel/contact
    const interactionType = location?.interactionType;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
      if (e.code === "Enter" && (interactionType === "panel" || interactionType === "contact")) {
        onDismiss();
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("keydown", handleKey);
    };
  }, [location, onDismiss, audio, muted]);

  return (
    <AnimatePresence>
      {location && <OverlayContent location={location} onDismiss={onDismiss} onBeginDescent={onBeginDescent} />}
    </AnimatePresence>
  );
};

// Click-to-copy field row used inside contact overlays
const ContactFields = ({
  email, linkedin, github, hasExternalLink,
}: { email: string; linkedin?: string; github?: string; hasExternalLink: boolean }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (value: string, key: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const fieldStyle = (key: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: "DM Mono, monospace",
    fontSize: "12px",
    color: copied === key ? "#C8860A" : "rgba(200,134,10,0.75)",
    background: "rgba(200,134,10,0.06)",
    border: `1px solid rgba(200,134,10,${copied === key ? "0.5" : "0.2"})`,
    borderRadius: "4px",
    padding: "7px 10px",
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s",
    letterSpacing: "0.02em",
    userSelect: "none",
    gap: "8px",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: hasExternalLink ? "4px" : "0" }}>
      <button onClick={() => copy(email, "email")} style={fieldStyle("email")}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{email}</span>
        <span style={{ fontSize: "10px", flexShrink: 0, color: copied === "email" ? "#C8860A" : "rgba(200,134,10,0.45)" }}>
          {copied === "email" ? "copied!" : "copy"}
        </span>
      </button>
      {linkedin && (
        <button onClick={() => copy(linkedin, "linkedin")} style={fieldStyle("linkedin")}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{linkedin}</span>
          <span style={{ fontSize: "10px", flexShrink: 0, color: copied === "linkedin" ? "#C8860A" : "rgba(200,134,10,0.45)" }}>
            {copied === "linkedin" ? "copied!" : "copy"}
          </span>
        </button>
      )}
      {github && (
        <button onClick={() => copy(github, "github")} style={fieldStyle("github")}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{github}</span>
          <span style={{ fontSize: "10px", flexShrink: 0, color: copied === "github" ? "#C8860A" : "rgba(200,134,10,0.45)" }}>
            {copied === "github" ? "copied!" : "copy"}
          </span>
        </button>
      )}
    </div>
  );
};

const OverlayContent = ({ location, onDismiss, onBeginDescent }: { location: Location; onDismiss: () => void; onBeginDescent?: () => void }) => {
  const { interactionType, content, name } = location;

  // Vignette — small text center-left
  if (interactionType === "vignette" && content.type === "vignette") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: "fixed",
          bottom: "30%",
          left: "5%",
          maxWidth: "280px",
          pointerEvents: "none",
          zIndex: 200,
        }}
      >
        {content.text.split("\n").map((line, i) => (
          <p key={i} style={{
            fontFamily: i === 0 ? "Playfair Display, serif" : "Inter, sans-serif",
            fontSize: i === 0 ? "18px" : "14px",
            color: i === 0 ? "#FAF8F4" : "rgba(250,248,244,0.7)",
            margin: "2px 0",
            lineHeight: 1.4,
          }}>
            {line}
          </p>
        ))}
      </motion.div>
    );
  }

  // Marker — trail milestone sign, top-center
  if (interactionType === "marker" && content.type === "vignette") {
    const lines = content.text.split("\n");
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.45 }}
        style={{
          position: "fixed",
          top: "16%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          pointerEvents: "none",
          zIndex: 200,
        }}
      >
        <div style={{
          background: "rgba(8,8,16,0.82)",
          border: "1px solid rgba(200,134,10,0.35)",
          borderRadius: "8px",
          padding: "10px 22px 12px",
          backdropFilter: "blur(10px)",
          minWidth: "140px",
        }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "22px",
            color: "#C8860A",
            margin: 0,
            letterSpacing: "0.12em",
            lineHeight: 1.1,
          }}>
            {lines[0]}
          </p>
          {lines.slice(1).map((line, i) => (
            <p key={i} style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              color: "rgba(250,248,244,0.68)",
              margin: "5px 0 0",
              lineHeight: 1.4,
            }}>
              {line}
            </p>
          ))}
        </div>
      </motion.div>
    );
  }

  // View — lines fade in center stage
  if (interactionType === "view" && content.type === "view") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
          zIndex: 200,
        }}
      >
        {content.lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.25, duration: 0.5 }}
            style={{
              fontFamily: i === 0 ? "Playfair Display, serif" : "Inter, sans-serif",
              fontSize: i === 0 ? "24px" : "16px",
              color: i === 0 ? "#FAF8F4" : "rgba(250,248,244,0.75)",
              margin: "4px 0",
              lineHeight: 1.4,
              letterSpacing: i === 0 ? "0.02em" : "0",
            }}
          >
            {line}
          </motion.p>
        ))}
      </motion.div>
    );
  }

  // Snowboard cache — descent trigger panel
  if (interactionType === "contact" && content.type === "snowboard") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={PANEL_STYLE}
      >
        <div style={{
          background: "rgba(10,10,20,0.88)",
          border: "1px solid rgba(200,134,10,0.35)",
          borderRadius: "8px",
          padding: "24px",
          backdropFilter: "blur(12px)",
        }}>
          <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#C8860A", margin: "0 0 8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {name}
          </p>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", color: "#FAF8F4", margin: "0 0 10px", lineHeight: 1.2 }}>
            {content.title}
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "rgba(250,248,244,0.75)", margin: "0 0 20px", lineHeight: 1.6 }}>
            {content.description}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => { onBeginDescent?.(); onDismiss(); }}
              style={{
                background: "#C8860A",
                border: "none",
                borderRadius: "4px",
                padding: "10px 16px",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#FAF8F4",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              Drop in →
            </button>
            <button
              onClick={onDismiss}
              style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "rgba(250,248,244,0.4)", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
            >
              {DISMISS_LABEL}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Newsletter kiosk — inline email signup form
  if ((interactionType === "contact" || interactionType === "kiosk") && content.type === "newsletter") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={PANEL_STYLE}
      >
        <div style={{
          background: "rgba(10,10,20,0.88)",
          border: "1px solid rgba(200,134,10,0.35)",
          borderRadius: "8px",
          padding: "24px",
          backdropFilter: "blur(12px)",
        }}>
          <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#C8860A", margin: "0 0 8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {name}
          </p>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", color: "#FAF8F4", margin: "0 0 10px", lineHeight: 1.2 }}>
            {content.title}
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "rgba(250,248,244,0.75)", margin: "0 0 20px", lineHeight: 1.6 }}>
            {content.description}
          </p>
          <NewsletterForm onDismiss={onDismiss} />
        </div>
      </motion.div>
    );
  }

  // Panel + Contact — side panel with project info
  if ((interactionType === "panel" || interactionType === "contact") &&
      (content.type === "panel" || content.type === "contact")) {
    const hasImage = content.type === "panel" && !!content.imageUrl;
    const stack    = content.type === "panel" ? content.stack : undefined;
    return (
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={PANEL_STYLE}
      >
        <div style={{
          background: "rgba(10,10,20,0.90)",
          border: "1px solid rgba(200,134,10,0.3)",
          borderRadius: "8px",
          backdropFilter: "blur(14px)",
          overflow: "hidden",
        }}>
          {/* Screenshot thumbnail */}
          {hasImage && (
            <div style={{ position: "relative", lineHeight: 0 }}>
              <img
                src={(content as { imageUrl: string }).imageUrl}
                alt={content.title}
                style={{
                  width: "100%",
                  height: "140px",
                  objectFit: "cover",
                  display: "block",
                  opacity: 0.85,
                }}
              />
              <div style={{
                position: "absolute",
                bottom: 0, left: 0, right: 0,
                height: "40px",
                background: "linear-gradient(transparent, rgba(10,10,20,0.90))",
              }} />
            </div>
          )}

          <div style={{ padding: "20px 22px 22px" }}>
            <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#C8860A", margin: "0 0 6px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {name}
            </p>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", color: "#FAF8F4", margin: "0 0 10px", lineHeight: 1.2 }}>
              {content.title}
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "rgba(250,248,244,0.78)", margin: "0 0 14px", lineHeight: 1.65 }}>
              {content.description}
            </p>

            {/* Tech stack chips */}
            {stack && stack.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "18px" }}>
                {stack.map(tech => (
                  <span key={tech} style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: "10px",
                    color: "rgba(200,134,10,0.75)",
                    background: "rgba(200,134,10,0.08)",
                    border: "1px solid rgba(200,134,10,0.2)",
                    borderRadius: "3px",
                    padding: "2px 7px",
                    letterSpacing: "0.04em",
                  }}>
                    {tech}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
              {content.type === "panel" && content.link && (
                <a
                  href={content.link}
                  target={content.link.startsWith("http") ? "_blank" : undefined}
                  rel={content.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  style={{
                    display: "inline-block",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#FAF8F4",
                    background: "#C8860A",
                    padding: "9px 16px",
                    borderRadius: "4px",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  {content.linkLabel ?? "Learn more"}
                </a>
              )}
              {content.type === "contact" && content.link && (
                <a
                  href={content.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#FAF8F4",
                    background: "#C8860A",
                    padding: "9px 16px",
                    borderRadius: "4px",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  {content.linkLabel ?? "Subscribe"}
                </a>
              )}
              {content.type === "contact" && (
                <ContactFields
                  email={content.email}
                  linkedin={content.linkedin}
                  github={content.github}
                  hasExternalLink={!!content.link}
                />
              )}
              <button
                onClick={onDismiss}
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: "11px",
                  color: "rgba(250,248,244,0.4)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left",
                }}
              >
                {DISMISS_LABEL}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

const NewsletterForm = ({ onDismiss }: { onDismiss: () => void }) => {
  const [email,   setEmail]   = useState("");
  const [status,  setStatus]  = useState<"idle" | "sending" | "done" | "error">("idle");

  const submit = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }, [email, status]);

  if (status === "done") {
    return (
      <div style={{ textAlign: "center", padding: "8px 0 12px" }}>
        <p style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", color: "#FAF8F4", margin: "0 0 6px" }}>
          You're in.
        </p>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "rgba(250,248,244,0.55)", margin: "0 0 16px" }}>
          Welcome to Sleeping Employees.
        </p>
        <button onClick={onDismiss} style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "rgba(250,248,244,0.4)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {DISMISS_LABEL}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); submit(); } }}
          placeholder="your@email.com"
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(200,134,10,0.3)",
            borderRadius: "4px",
            padding: "8px 12px",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#FAF8F4",
            outline: "none",
          }}
        />
        <button
          onClick={submit}
          disabled={status === "sending" || !email.trim()}
          style={{
            background: "#C8860A",
            border: "none",
            borderRadius: "4px",
            padding: "8px 14px",
            fontFamily: "DM Mono, monospace",
            fontSize: "12px",
            color: "#FAF8F4",
            cursor: status === "sending" ? "wait" : "pointer",
            opacity: !email.trim() ? 0.5 : 1,
            flexShrink: 0,
          }}
        >
          {status === "sending" ? "..." : "->"}
        </button>
      </div>
      {status === "error" && (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "rgba(200,80,80,0.8)", margin: "0 0 8px" }}>
          Something went wrong. Try again.
        </p>
      )}
      <button onClick={onDismiss} style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "rgba(250,248,244,0.4)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        {DISMISS_LABEL}
      </button>
    </div>
  );
};
