import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="animate-slide-down fixed top-0 right-0 left-0 z-[60] flex items-center justify-center gap-2 bg-amber-500/90 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm">
      <WifiOff className="h-3.5 w-3.5" />
      오프라인 상태입니다. 캐시된 데이터를 표시합니다.
    </div>
  );
}
