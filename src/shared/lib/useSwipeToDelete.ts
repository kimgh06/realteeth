import { useRef, useState, useCallback, useEffect } from "react";

const THRESHOLD_RATIO = 0.4;

export function useSwipeToDelete(onDelete: () => void) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [springBack, setSpringBack] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef<"horizontal" | "vertical" | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0]!.clientX;
    startY.current = e.touches[0]!.clientY;
    locked.current = null;
    setSpringBack(false);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const dx = e.touches[0]!.clientX - startX.current;
    const dy = e.touches[0]!.clientY - startY.current;

    if (!locked.current) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        locked.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      }
      return;
    }

    if (locked.current === "vertical") return;

    setIsSwiping(true);
    setSwipeOffset(Math.min(0, dx));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping) return;

    const cardWidth = cardRef.current?.offsetWidth ?? 200;
    if (Math.abs(swipeOffset) > cardWidth * THRESHOLD_RATIO) {
      onDelete();
      setSwipeOffset(0);
    } else {
      setSpringBack(true);
      setSwipeOffset(0);
      setTimeout(() => setSpringBack(false), 300);
    }
    setIsSwiping(false);
    locked.current = null;
  }, [isSwiping, swipeOffset, onDelete]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const containerStyle: React.CSSProperties = {
    transform: `translateX(${swipeOffset}px)`,
    transition: springBack ? "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : isSwiping ? "none" : undefined,
  };

  return { cardRef, swipeOffset, isSwiping, containerStyle };
}
