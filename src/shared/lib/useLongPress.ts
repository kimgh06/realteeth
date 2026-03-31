import { useRef, useCallback } from "react";

export function useLongPress(onLongPress: () => void, delay = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moved = useRef(false);

  const start = useCallback(() => {
    moved.current = false;
    timer.current = setTimeout(() => {
      if (!moved.current) {
        onLongPress();
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const move = useCallback(() => {
    moved.current = true;
    cancel();
  }, [cancel]);

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: move,
  };
}
