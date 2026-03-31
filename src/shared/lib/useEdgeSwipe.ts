import { useRef, useCallback, useEffect } from "react";

const EDGE_ZONE = 20;

export function useEdgeSwipe(onOpen: () => void) {
  const startX = useRef(0);
  const startY = useRef(0);
  const phase = useRef<"idle" | "pending" | "swiping" | "cancelled">("idle");

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const x = e.touches[0]!.clientX;
    if (x > EDGE_ZONE) {
      phase.current = "idle";
      return;
    }
    startX.current = x;
    startY.current = e.touches[0]!.clientY;
    phase.current = "pending";
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (phase.current === "idle" || phase.current === "cancelled") return;

    const dx = e.touches[0]!.clientX - startX.current;
    const dy = e.touches[0]!.clientY - startY.current;

    if (phase.current === "pending") {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        if (Math.abs(dy) > Math.abs(dx)) {
          phase.current = "cancelled";
        } else if (dx > 0) {
          phase.current = "swiping";
        } else {
          phase.current = "cancelled";
        }
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (phase.current === "swiping") {
      // Check if we traveled far enough (use last known position)
      // Since we can't easily get final position in touchend,
      // the fact that we're still in 'swiping' phase after direction lock
      // means the user committed to a rightward swipe from edge
      onOpen();
    }
    phase.current = "idle";
  }, [onOpen]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
}
