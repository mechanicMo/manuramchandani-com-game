import { Component, type ReactNode } from "react";
import { GameCanvas } from "@/components/game/GameCanvas";

type EBState = { hasError: boolean };

class GameErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(err: Error) {
    console.error("[Game]", err);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        height: "100%",
        backgroundColor: "#06091A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 24px",
      }}>
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#C8860A", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 16px" }}>
            WebGL Error
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", color: "#FAF8F4", margin: "0 0 12px", fontWeight: 700 }}>
            The mountain won't load.
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "rgba(250,248,244,0.5)", margin: "0 0 32px", maxWidth: "320px", lineHeight: 1.6 }}>
            This site requires WebGL. Try a different browser, or check that hardware acceleration is enabled.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#C8860A", background: "none", border: "1px solid rgba(200,134,10,0.35)", borderRadius: "4px", padding: "8px 16px", cursor: "pointer", letterSpacing: "0.06em" }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}

const Index = () => (
  <GameErrorBoundary>
    <GameCanvas />
  </GameErrorBoundary>
);

export default Index;
