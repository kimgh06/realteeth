import { X } from "lucide-react";
import type { Toast } from "@/shared/lib/useToast";

interface Props {
  toast: Toast;
  onDismiss: () => void;
}

export function ToastItem({ toast, onDismiss }: Props) {
  const handleAction = () => {
    toast.action?.onClick();
    onDismiss();
  };

  return (
    <div className={`${toast.exiting ? "animate-slide-down-out" : "animate-slide-up"} pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 shadow-lg backdrop-blur-xl`}>
      <span className="text-sm text-white/90">{toast.message}</span>
      {toast.action && (
        <button
          onClick={handleAction}
          className="shrink-0 text-sm font-medium text-sky-300 hover:text-sky-200"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        className="shrink-0 text-white/40 hover:text-white/70"
        aria-label="닫기"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
