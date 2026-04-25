// src/components/ui/LocationOverlay.tsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Location } from "@/data/locations";
import type { useAudioManager } from "@/hooks/useAudioManager";

type Props = {
  location: Location | null;
  onDismiss: () => void;
  audio?: ReturnType<typeof useAudioManager>;
  muted?: boolean;
};

export const LocationOverlay = ({ location, onDismiss, audio, muted = false }: Props) => {
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLocRef   = useRef<Location | null>(null);

  useEffect(() => {
    const prevLoc = prevLocRef.current;
    prevLocRef.current = location;

    if (location) {
      const { interactionType } = location;

      // Play panel-open sound for panel/contact types
      if ((interactionType === "panel" || interactionType === "contact") && audio && !muted) {
        audio.play("panel-open");
      }

      // Auto-dismiss vignette and view after 3 seconds; marker after 4 seconds
      if (interactionType === "vignette") {
        timerRef.current = setTimeout(onDismiss, 3000);
      }
      if (interactionType === "marker") {
        timerRef.current = setTimeout(onDismiss, 4000);
      }
    } else if (prevLoc) {
      // Play panel-close when a panel/contact overlay is dismissed
      const { interactionType } = prevLoc;
      if ((interactionType === "panel" || interactionType === "contact") && audio && !muted) {
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
      {location && <OverlayContent location={location} onDismiss={onDismiss} />}
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

const OverlayContent = ({ location, onDismiss }: { location: Location; onDismiss: () => void }) => {
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

  // Panel + Contact — side panel with project info
  if ((interactionType === "panel" || interactionType === "contact") &&
      (content.type === "panel" || content.type === "contact")) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: "50%",
          left: "5%",
          transform: "translateY(-50%)",
          width: "320px",
          zIndex: 200,
        }}
      >
        <div style={{
          background: "rgba(10,10,20,0.85)",
          border: "1px solid rgba(200,134,10,0.3)",
          borderRadius: "8px",
          padding: "24px",
          backdropFilter: "blur(12px)",
        }}>
          <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#C8860A", margin: "0 0 8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {name}
          </p>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", color: "#FAF8F4", margin: "0 0 12px", lineHeight: 1.2 }}>
            {content.title}
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "rgba(250,248,244,0.8)", margin: "0 0 20px", lineHeight: 1.6 }}>
            {content.description}
          </p>

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
                  padding: "8px 16px",
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
                  padding: "8px 16px",
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
              [Enter] dismiss
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};
