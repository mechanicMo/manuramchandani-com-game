import { motion, AnimatePresence } from "framer-motion";
import type { GamePhase } from "@/hooks/useGamePhase";

type Hint = { key: string; label: string };

const HINTS: Record<GamePhase, Hint[]> = {
  ascent: [
    { key: "↑ ↓", label: "Climb" },
    { key: "← →", label: "Move across" },
    { key: "SPACE", label: "Jump to next hold" },
  ],
  summit: [
    { key: "SPACE", label: "Begin descent" },
  ],
  descent: [
    { key: "← →", label: "Carve" },
    { key: "SPACE", label: "Jump" },
    { key: "↓", label: "Tuck" },
  ],
};

const sans = "'Inter', system-ui, sans-serif";

type Props = {
  phase: GamePhase;
  nearbyName: string | null;
};

export const KeyHints = ({ phase, extraHint, nearbyName }: Props) => {
  const hints = HINTS[phase];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 16,
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={phase + (extraHint ?? "") + (nearbyName ?? "")}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          {hints.map(h => (
            <div key={h.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  color: "#C8860A",
                  backgroundColor: "rgba(200,134,10,0.12)",
                  border: "1px solid rgba(200,134,10,0.3)",
                  borderRadius: 4,
                  padding: "3px 7px",
                  whiteSpace: "nowrap",
                }}
              >
                {h.key}
              </span>
              <span
                style={{
                  fontFamily: sans,
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(240,237,230,0.45)",
                }}
              >
                {h.label}
              </span>
            </div>
          ))}
          {nearbyName && (
            <>
              <div style={{ width: 1, height: 16, backgroundColor: "rgba(240,237,230,0.15)" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(200,134,10,0.8)", letterSpacing: "0.08em" }}>
                [Enter] View — {nearbyName}
              </span>
            </>
          )}
          {extraHint && (
            <>
              <div style={{ width: 1, height: 16, backgroundColor: "rgba(240,237,230,0.15)" }} />
              <span style={{ fontFamily: sans, fontSize: "11px", color: "rgba(200,134,10,0.8)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {extraHint}
              </span>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
