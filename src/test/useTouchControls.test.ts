import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTouchControls } from "@/hooks/useTouchControls";

describe("useTouchControls", () => {
  it("starts with zero delta", () => {
    const { result } = renderHook(() => useTouchControls());
    expect(result.current.x).toBe(0);
    expect(result.current.y).toBe(0);
  });
});
