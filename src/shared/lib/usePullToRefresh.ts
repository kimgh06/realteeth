import { useRef, useState, useCallback, useEffect } from "react";

const THRESHOLD = 60;

export function usePullToRefresh(onRefresh: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullOffset, setPullOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0]!.clientY;
      pulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || isRefreshing) return;
    const diff = e.touches[0]!.clientY - startY.current;
    if (diff > 0) {
      setPullOffset(Math.min(diff * 0.5, 100));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullOffset >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullOffset(0);
      }, 1500);
    } else {
      setPullOffset(0);
    }
  }, [pullOffset, isRefreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
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

  return { containerRef, pullOffset, isRefreshing };
}
