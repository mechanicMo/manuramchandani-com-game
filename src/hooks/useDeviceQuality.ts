import { useMemo } from "react";

export type QualityLevel = "high" | "medium" | "low";

export const useDeviceQuality = (): QualityLevel => {
  return useMemo(() => {
    const isMobile =
      window.matchMedia("(max-width: 768px)").matches ||
      "ontouchstart" in window;
    if (isMobile) return "low";

    if (window.devicePixelRatio < 2 || window.innerWidth < 1440) return "medium";

    return "high";
  }, []);
};
