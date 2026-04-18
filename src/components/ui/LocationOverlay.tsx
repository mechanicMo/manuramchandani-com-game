// src/components/ui/LocationOverlay.tsx
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Location } from "@/data/locations";

type Props = {
  location: Location | null;
  onDismiss: () => void;
};

export const LocationOverlay = ({ location, onDismiss }: Props) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!location) return;
    const { interactionType } = location;

    // Auto-dismiss gate and vignette after 3 seconds
    if (interactionType === "gate" || interactionType === "vignette") {
      timerRef.current = setTimeout(onDismiss, 3000);
    }

    // Dismiss on Escape
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Enter") onDismiss();
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("keydown", handleKey);
    };
  }, [location, onDismiss]);

  return (
    <AnimatePresence>
      {location && <OverlayContent location={location} onDismiss={onDismiss} />}
    </AnimatePresence>
  );
};

const OverlayContent = ({ location, onDismiss }: { location: Location; onDismiss: () => void }) => {
  const { interactionType, content, name } = location;

  // Gate flash — centered brief headline
  if (interactionType === "gate" && content.type === "gate") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          pointerEvents: "none",
          zIndex: 200,
        }}
      >
        <div style={{
          background: "rgba(255,102,0,0.12)",
          border: "1px solid rgba(255,102,0,0.4)",
          borderRadius: "4px",
          padding: "12px 24px",
          backdropFilter: "blur(4px)",
        }}>
          <p style={{ fontFamily: "DM Mono, monospace", fontSize: "13px", color: "#ff9900", margin: 0, letterSpacing: "0.05em" }}>
            SLEEPING EMPLOYEES
          </p>
          <p style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", color: "#FAF8F4", margin: "4px 0 0", lineHeight: 1.3 }}>
            {content.headline}
          </p>
        </div>
      </motion.div>
    );
  }

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
            {content.type === "contact" && content.email && (
              <a
                href={`mailto:${content.email}`}
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
                {content.linkLabel ?? "Get in touch"}
              </a>
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
