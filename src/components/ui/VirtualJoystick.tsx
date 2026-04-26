// src/components/ui/VirtualJoystick.tsx
import { useRef, useCallback } from "react";
import { updateTouchDelta, setMobileJump } from "@/hooks/useTouchControls";

const isTouchDevice = () => "ontouchstart" in window || navigator.maxTouchPoints > 0;

const RING_RADIUS  = 52; // px — outer ring radius
const KNOB_RADIUS  = 22; // px — moveable knob radius

type Props = {
  nearbyName: string | null;
  onInteract: () => void;
  onOpenChat: () => void;
  showInteractAlways?: boolean;
};

export const VirtualJoystick = ({ nearbyName, onInteract, onOpenChat, showInteractAlways = false }: Props) => {
  if (!isTouchDevice()) return null;

  const knobRef      = useRef<HTMLDivElement>(null);
  const activeId     = useRef<number | null>(null);
  const ringCenter   = useRef({ x: 0, y: 0 });

  const moveKnob = useCallback((nx: number, ny: number) => {
    if (!knobRef.current) return;
    knobRef.current.style.transform = `translate(${nx * RING_RADIUS}px, ${-ny * RING_RADIUS}px)`;
    updateTouchDelta({ x: nx, y: -ny }); // y is inverted: up pointer = forward
  }, []);

  const resetKnob = useCallback(() => {
    if (!knobRef.current) return;
    knobRef.current.style.transform = "translate(0px, 0px)";
    updateTouchDelta({ x: 0, y: 0 });
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activeId.current !== null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    activeId.current = e.pointerId;
    const rect = e.currentTarget.getBoundingClientRect();
    ringCenter.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activeId.current) return;
    const dx = e.clientX - ringCenter.current.x;
    const dy = e.clientY - ringCenter.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, RING_RADIUS);
    const angle = Math.atan2(dy, dx);
    const nx = (Math.cos(angle) * clamped) / RING_RADIUS;
    const ny = (Math.sin(angle) * clamped) / RING_RADIUS;
    moveKnob(nx, ny);
  }, [moveKnob]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activeId.current) return;
    activeId.current = null;
    resetKnob();
  }, [resetKnob]);

  const onJumpDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setMobileJump(true);
  }, []);

  const onJumpUp = useCallback(() => {
    setMobileJump(false);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 200,
      }}
    >
      {/* Joystick — bottom-left */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: "absolute",
          bottom: "calc(60px + env(safe-area-inset-bottom, 0px))",
          left: 44,
          width:  RING_RADIUS * 2,
          height: RING_RADIUS * 2,
          borderRadius: "50%",
          background: "rgba(8,8,16,0.45)",
          border: "1.5px solid rgba(200,134,10,0.35)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: "none",
          pointerEvents: "auto",
          cursor: "grab",
        }}
      >
        <div
          ref={knobRef}
          style={{
            width:  KNOB_RADIUS * 2,
            height: KNOB_RADIUS * 2,
            borderRadius: "50%",
            background: "rgba(200,134,10,0.55)",
            border: "1.5px solid rgba(200,134,10,0.8)",
            transition: "transform 0.05s ease",
            pointerEvents: "none",
            willChange: "transform",
          }}
        />
      </div>

      {/* Jump button — bottom-right */}
      <div
        onPointerDown={onJumpDown}
        onPointerUp={onJumpUp}
        onPointerCancel={onJumpUp}
        style={{
          position: "absolute",
          bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          right: 52,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "rgba(8,8,16,0.55)",
          border: "1.5px solid rgba(200,134,10,0.4)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: "none",
          pointerEvents: "auto",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "rgba(200,134,10,0.85)", letterSpacing: "0.04em" }}>
          JMP
        </span>
      </div>

      {/* Interact button — above jump, shown when near a panel/contact OR when showInteractAlways */}
      {(nearbyName || showInteractAlways) && (
        <div
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE", key: "e", bubbles: true }));
          }}
          style={{
            position: "absolute",
            bottom: "calc(136px + env(safe-area-inset-bottom, 0px))",
            right: 52,
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: nearbyName ? "rgba(200,134,10,0.18)" : "rgba(200,134,10,0.06)",
            border: `1.5px solid rgba(200,134,10,${nearbyName ? "0.65" : "0.30"})`,
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            touchAction: "none",
            pointerEvents: "auto",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: nearbyName ? "#C8860A" : "rgba(200,134,10,0.45)", letterSpacing: "0.04em" }}>
            [E]
          </span>
        </div>
      )}

      {/* Chat button — bottom-right of jump stack */}
      <div
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onOpenChat(); }}
        style={{
          position: "absolute",
          bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          right: 116,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(8,8,16,0.45)",
          border: "1px solid rgba(125,249,240,0.25)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: "none",
          pointerEvents: "auto",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "rgba(125,249,240,0.7)", letterSpacing: "0.04em" }}>
          CHAT
        </span>
      </div>
    </div>
  );
};
