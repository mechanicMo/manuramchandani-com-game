// src/components/ui/ShortcutsHelp.tsx
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SHORTCUTS = [
  { keys: "↑ / W",       label: "Climb up"                                    },
  { keys: "↓ / S",       label: "Climb down"                                  },
  { keys: "← → / A D",   label: "Move across the wall"                        },
  { keys: "SPACE",        label: "Jump to next hold / Begin descent at summit" },
  { keys: "ENTER",        label: "Interact with location / Dismiss overlay"    },
  { keys: "C",            label: "Open chat with Beacon"                       },
  { keys: "M",            label: "Mute / unmute all audio"                     },
  { keys: "?",            label: "Show this help"                              },
  { keys: "ESC",          label: "Close overlay or help"                       },
];

const mono = "'DM Mono', monospace";
const sans = "'Inter', system-ui, sans-serif";

export const ShortcutsHelp = ({ open, onClose }: Props) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 400,
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1,    y:  0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(8,8,16,0.95)",
              border: "1px solid rgba(200,134,10,0.35)",
              borderRadius: "12px",
              padding: "24px 28px",
              width: "min(400px, 90vw)",
              zIndex: 401,
              backdropFilter: "blur(20px)",
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}>
              <p style={{
                fontFamily: mono,
                fontSize: "11px",
                color: "#C8860A",
                margin: 0,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                Keyboard Shortcuts
              </p>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(250,248,244,0.4)",
                  cursor: "pointer",
                  fontSize: "18px",
                  lineHeight: 1,
                  padding: "0 4px",
                }}
              >
                x
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {SHORTCUTS.map(s => (
                <div key={s.keys} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{
                    fontFamily: mono,
                    fontSize: "11px",
                    color: "#C8860A",
                    background: "rgba(200,134,10,0.1)",
                    border: "1px solid rgba(200,134,10,0.25)",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    minWidth: "100px",
                    textAlign: "center",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}>
                    {s.keys}
                  </span>
                  <span style={{
                    fontFamily: sans,
                    fontSize: "13px",
                    color: "rgba(250,248,244,0.75)",
                    lineHeight: 1.4,
                  }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
