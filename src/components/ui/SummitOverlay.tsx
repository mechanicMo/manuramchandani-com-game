import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = { phase: GamePhase };

export const SummitOverlay = ({ phase }: Props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (phase === "summit") {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 4500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="summit-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.2 } }}
          transition={{ duration: 0.6 }}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 150,
          }}
        >
          {/* Radial vignette */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(5,8,15,0.55) 100%)",
          }} />

          <div style={{ position: "relative", textAlign: "center" }}>
            {/* Title */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "48px",
                color: "#FAF8F4",
                margin: "0 0 12px",
                letterSpacing: "0.03em",
                lineHeight: 1.1,
              }}
            >
              The Summit
            </motion.p>

            {/* Rule */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
              style={{
                height: 1,
                background: "rgba(200,134,10,0.45)",
                width: "120px",
                margin: "0 auto 14px",
                transformOrigin: "center",
              }}
            />

            {/* Elevation */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "13px",
                color: "rgba(200,134,10,0.9)",
                margin: "0 0 8px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              4,300 m
            </motion.p>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.5, ease: "easeOut" }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                color: "rgba(250,248,244,0.5)",
                margin: 0,
                letterSpacing: "0.06em",
              }}
            >
              The mountain. The machine. The work.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
