// src/components/ui/LoadingScreen.tsx
import { motion, AnimatePresence } from "framer-motion";

type Props = { loading: boolean };

export const LoadingScreen = ({ loading }: Props) => (
  <AnimatePresence>
    {loading && (
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          backgroundColor: "#06091A",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 24,
        }}
      >
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 700, color: "#F0EDE6", letterSpacing: "-0.02em" }}>
          Manu Ramchandani
        </div>
        <div style={{ width: 200, height: 2, backgroundColor: "rgba(240,237,230,0.1)", borderRadius: 1, overflow: "hidden" }}>
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            style={{ width: "50%", height: "100%", backgroundColor: "#C8860A", borderRadius: 1 }}
          />
        </div>
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)" }}>
          Loading world
        </span>
      </motion.div>
    )}
  </AnimatePresence>
);
