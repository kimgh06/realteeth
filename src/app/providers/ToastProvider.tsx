import { useState, useCallback, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ToastContext, type Toast } from "@/shared/lib/useToast";
import { ToastItem } from "@/shared/ui/Toast";

const MAX_TOASTS = 2;
const EXIT_DURATION = 300;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissToast = useCallback((id: string) => {
    // Clear any existing timer
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    // Stage 1: mark as exiting (triggers exit animation)
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );

    // Stage 2: remove from DOM after animation completes
    setTimeout(() => removeToast(id), EXIT_DURATION);
  }, [removeToast]);

  const showToast = useCallback(
    (message: string, options?: { action?: Toast["action"]; duration?: number }) => {
      const duration = options?.duration ?? (options?.action ? 5000 : 3000);
      const id = crypto.randomUUID();
      const toast: Toast = { id, message, action: options?.action, duration };

      setToasts((prev) => {
        const next = [...prev, toast];
        if (next.length > MAX_TOASTS) {
          const evicted = next[0]!;
          const evictTimer = timers.current.get(evicted.id);
          if (evictTimer) {
            clearTimeout(evictTimer);
            timers.current.delete(evicted.id);
          }
          return next.slice(1);
        }
        return next;
      });

      // Auto-dismiss: trigger exit animation, then remove
      const timer = setTimeout(() => {
        timers.current.delete(id);
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
        );
        setTimeout(() => removeToast(id), EXIT_DURATION);
      }, duration);
      timers.current.set(id, timer);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed bottom-6 left-0 right-0 z-[70] flex flex-col items-center gap-2"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          role="status"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => dismissToast(toast.id)}
            />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
