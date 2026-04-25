// src/components/ui/LoadingScreen.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useProgress } from "@react-three/drei";

type Props = { loading: boolean };

export const LoadingScreen = ({ loading }: Props) => {
  const { progress } = useProgress();

  return (
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
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 700, color: "#F0EDE6", letterSpacing: "-0.02em" }}>
              Manu Ramchandani
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "rgba(200,134,10,0.7)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "8px" }}>
              Mountain and the Machine
            </div>
          </div>
          <div style={{ width: 200, height: 2, backgroundColor: "rgba(240,237,230,0.1)", borderRadius: 1, overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", backgroundColor: "#C8860A", borderRadius: 1, transformOrigin: "left" }}
              animate={{ scaleX: progress / 100 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.15em", color: "rgba(200,134,10,0.5)" }}>
            {Math.floor(progress)}%
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
