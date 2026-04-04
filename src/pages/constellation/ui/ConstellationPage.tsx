import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useGeolocation } from "@/features/detect-location/model/useGeolocation";
import { useDeviceOrientation } from "@/features/constellation-ar/hooks/useDeviceOrientation";
import { PermissionGate } from "@/features/constellation-ar/ui/PermissionGate";
import { SkyCanvas } from "@/features/constellation-ar/ui/SkyCanvas";
import { CenterIndicator } from "@/features/constellation-ar/ui/CenterIndicator";
import { CompassHints } from "@/features/constellation-ar/ui/CompassHints";
import catalogData from "@/features/constellation-ar/data/catalog.json";
import type { CatalogData } from "@/features/constellation-ar/model/types";

const catalog = catalogData as CatalogData;

function headingLabel(azimuth: number): string {
  const dirs = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  return dirs[Math.round(azimuth / 45) % 8]!;
}

export function ConstellationPage() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const {
    azimuth,
    altitude,
    dragOffset,
    onMouseDown,
    onTouchStart,
    permission: orientationPermission,
    requestOrientation,
  } = useDeviceOrientation();

  const [centerConstellation, setCenterConstellation] = useState<string | null>(null);
  const [showDaytimeBanner, setShowDaytimeBanner] = useState(true);
  const [showDebug, setShowDebug] = useState(import.meta.env.DEV);

  const localHour = new Date().getHours();
  const isDaytime = localHour >= 6 && localHour < 19;

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

  const isDesktop = orientationPermission === "unsupported";
  const showPermissionGate = !isDesktop && orientationPermission !== "granted";

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#0d1b2a]"
      style={{ touchAction: "none" }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {showPermissionGate ? (
        <PermissionGate
          orientationPermission={orientationPermission}
          onRequest={requestOrientation}
        />
      ) : (
        <>
          {/* Star canvas overlay */}
          <SkyCanvas
            catalog={catalog}
            orientation={{ azimuth, altitude }}
            dragOffset={dragOffset}
            lat={lat}
            lon={lon}
            onCenterConstellation={setCenterConstellation}
          />

          {/* Compass hints (mobile only) */}
          {!isDesktop && <CompassHints alpha={azimuth} />}

          {/* Desktop drag hint */}
          {isDesktop && navigator.maxTouchPoints === 0 && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/30 px-3 py-1 text-xs text-white/50 backdrop-blur-sm">
              드래그하여 탐색
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
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-semibold text-white drop-shadow">별자리 찾기</span>
              {!isDesktop ? (
                <span className="text-[11px] text-white/50 tabular-nums">
                  {headingLabel(azimuth)} · {Math.round(azimuth)}° · 고도 {Math.round(altitude)}°
                </span>
              ) : (
                <span className="text-[11px] text-white/50 tabular-nums">
                  {headingLabel((dragOffset.az % 360 + 360) % 360)} · 고도 {Math.round(Math.max(-90, Math.min(90, altitude - dragOffset.alt)))}°
                </span>
              )}
            </div>
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

          {showDebug && (
            <button
              onClick={() => setShowDebug(false)}
              className="absolute right-2 bottom-20 z-50 rounded bg-white/10 px-2 py-1 text-[10px] text-white/60"
            >
              <div>ori={orientationPermission}</div>
              <div>desktop={isDesktop ? "Y" : "N"} gate={showPermissionGate ? "Y" : "N"}</div>
              <div>az={Math.round(azimuth)}° alt={Math.round(altitude)}°</div>
              <div>drag az={Math.round(dragOffset.az)} alt={Math.round(dragOffset.alt)}</div>
              <div>lat={lat.toFixed(2)} lon={lon.toFixed(2)}</div>
              <div>secure={window.isSecureContext ? "Y" : "N"}</div>
              <div className="mt-1 text-white/40">tap to dismiss</div>
            </button>
          )}

          {/* Bottom constellation indicator */}
          <CenterIndicator constellationName={centerConstellation} />
        </>
      )}
    </div>
  );
}
