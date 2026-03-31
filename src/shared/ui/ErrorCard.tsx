import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorCard({
  message = "해당 장소의 정보가 제공되지 않습니다.",
  onRetry,
}: Props) {
  return (
    <div className="mx-4 mt-40 rounded-2xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur-xl">
      <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400/80" />
      <p className="mb-4 text-sm text-white/80">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white/90 transition-colors hover:bg-white/20"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          다시 시도
        </button>
      )}
    </div>
  );
}
