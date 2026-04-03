import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useGeolocation } from "@/features/detect-location/model/useGeolocation";
import { useCamera } from "@/features/constellation-ar/hooks/useCamera";
import { useDeviceOrientation } from "@/features/constellation-ar/hooks/useDeviceOrientation";
import { PermissionGate } from "@/features/constellation-ar/ui/PermissionGate";
import { SkyCanvas } from "@/features/constellation-ar/ui/SkyCanvas";
import { CenterIndicator } from "@/features/constellation-ar/ui/CenterIndicator";
import { CompassHints } from "@/features/constellation-ar/ui/CompassHints";
import catalogData from "@/features/constellation-ar/data/catalog.json";
import type { CatalogData } from "@/features/constellation-ar/model/types";

const catalog = catalogData as CatalogData;

export function ConstellationPage() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const { videoRef, permission: cameraPermission, requestCamera } = useCamera();
  const {
    alpha,
    beta,
    gamma,
    dragOffset,
    onMouseDown,
    permission: orientationPermission,
    requestOrientation,
  } = useDeviceOrientation();

  const [centerConstellation, setCenterConstellation] = useState<string | null>(null);
  const [showDaytimeBanner, setShowDaytimeBanner] = useState(true);

  const localHour = new Date().getHours();
  const isDaytime = localHour >= 6 && localHour < 19;

  // Auto-detect desktop: try orientation immediately on mount
  // If no gyroscope, orientationPermission becomes 'unsupported'
  useEffect(() => {
    requestOrientation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desktop = no compass available
  const isDesktop = orientationPermission === "unsupported";

  const requestAll = async () => {
    if (isDesktop) return; // desktop: no permissions needed
    await requestCamera();
    await requestOrientation();
  };

  // Lock portrait orientation (fails silently on desktop)
  useEffect(() => {
    const ori = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
      unlock?: () => void;
    };
    ori.lock?.("portrait").catch(() => {});
    return () => ori.unlock?.();
  }, []);

  const lat = geo.lat ?? 37.5665;
  const lon = geo.lon ?? 126.978;

  // Desktop: skip permission gate entirely, go straight to star map
  // Mobile: need camera + orientation granted
  const showPermissionGate =
    !isDesktop &&
    (cameraPermission !== "granted" || orientationPermission !== "granted");

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#0d1b2a]"
      style={{ touchAction: "none" }}
      onMouseDown={onMouseDown}
    >
      {showPermissionGate ? (
        <PermissionGate
          cameraPermission={cameraPermission}
          orientationPermission={orientationPermission}
          onRequest={requestAll}
        />
      ) : (
        <>
          {/* Camera feed — mobile only */}
          {!isDesktop && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Star canvas overlay */}
          <SkyCanvas
            catalog={catalog}
            orientation={{ alpha, beta, gamma }}
            dragOffset={dragOffset}
            lat={lat}
            lon={lon}
            onCenterConstellation={setCenterConstellation}
          />

          {/* Compass hints (mobile only) */}
          {!isDesktop && <CompassHints alpha={alpha} />}

          {/* Desktop drag hint */}
          {isDesktop && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/30 px-3 py-1 text-xs text-white/50 backdrop-blur-sm">
              마우스로 드래그하여 탐색
            </div>
          )}

          {/* Top bar */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full bg-black/30 p-2 backdrop-blur-sm"
              aria-label="뒤로가기"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            <span className="text-sm font-semibold text-white drop-shadow">별자리 찾기</span>
            <div className="w-9" />
          </div>

          {/* Daytime banner */}
          {isDaytime && showDaytimeBanner && (
            <div className="absolute left-4 right-4 top-16 flex items-center justify-between rounded-xl bg-amber-500/20 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm text-amber-200">별은 밤에 더 잘 보여요</span>
              <button
                onClick={() => setShowDaytimeBanner(false)}
                className="text-amber-200/60 hover:text-amber-200"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Bottom constellation indicator */}
          <CenterIndicator constellationName={centerConstellation} />
        </>
      )}
    </div>
  );
}
