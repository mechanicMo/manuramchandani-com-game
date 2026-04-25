import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = { phase: GamePhase };

export const DescentOverlay = ({ phase }: Props) => {
  const [visible, setVisible] = useState(false);
  const prevPhase = useRef<GamePhase>("ascent");

  useEffect(() => {
    if (prevPhase.current !== "descent" && phase === "descent") {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3500);
      prevPhase.current = phase;
      return () => clearTimeout(t);
    }
    prevPhase.current = phase;
  }, [phase]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="descent-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.0 } }}
          transition={{ duration: 0.5 }}
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
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(5,10,20,0.45) 100%)",
          }} />

          <div style={{ position: "relative", textAlign: "center" }}>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.55, ease: "easeOut" }}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "42px",
                color: "#e8eef5",
                margin: "0 0 10px",
                letterSpacing: "0.03em",
                lineHeight: 1.1,
              }}
            >
              The Descent
            </motion.p>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.45, duration: 0.45, ease: "easeOut" }}
              style={{
                height: 1,
                background: "rgba(200,220,255,0.3)",
                width: "100px",
                margin: "0 auto 12px",
                transformOrigin: "center",
              }}
            />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.45, ease: "easeOut" }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                color: "rgba(220,230,250,0.55)",
                margin: 0,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Carve. Remember. Ship.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
