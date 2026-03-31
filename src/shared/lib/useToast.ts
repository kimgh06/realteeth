import { createContext, useContext } from "react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  action?: ToastAction;
  duration: number;
  exiting?: boolean;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, options?: { action?: ToastAction; duration?: number }) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
