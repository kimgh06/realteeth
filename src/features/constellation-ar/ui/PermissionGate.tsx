import { Telescope } from "lucide-react";
import type { PermissionState } from "../model/types";

interface Props {
  cameraPermission: PermissionState;
  orientationPermission: PermissionState;
  onRequest: () => void;
}

export function PermissionGate({ cameraPermission, orientationPermission, onRequest }: Props) {
  const isUnsupported = cameraPermission === "unsupported";
  const isOrientationOnly = orientationPermission === "unsupported" && cameraPermission !== "unsupported";
  const isCameraDenied = cameraPermission === "denied";
  const isOrientationDenied = orientationPermission === "denied";
  const isRequesting =
    cameraPermission === "requesting" || orientationPermission === "requesting";

  if (!window.isSecureContext) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0d1b2a] px-8 text-center">
        <Telescope className="mb-6 h-16 w-16 text-white/30" />
        <h1 className="mb-2 text-xl font-semibold text-white">별자리 찾기</h1>
        <p className="text-sm text-white/50">HTTPS 환경에서만 사용할 수 있습니다</p>
      </div>
    );
  }

  if (isUnsupported) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0d1b2a] px-8 text-center">
        <Telescope className="mb-6 h-16 w-16 text-white/30" />
        <h1 className="mb-2 text-xl font-semibold text-white">별자리 찾기</h1>
        <p className="text-sm text-white/50">이 기기에서는 지원하지 않습니다</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0d1b2a] px-8 text-center">
      <div className="mb-6 rounded-full bg-white/10 p-6">
        <Telescope className="h-12 w-12 text-sky-400" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-white">별자리 찾기</h1>
      <p className="mb-8 text-sm text-white/50">
        카메라와 기기 방향 권한이 필요합니다
      </p>

      {isCameraDenied && (
        <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-left">
          <p className="text-sm text-red-300">
            설정 &gt; Safari &gt; 카메라 권한을 허용해주세요
          </p>
        </div>
      )}

      {isOrientationDenied && (
        <div className="mb-4 rounded-xl bg-amber-500/15 px-4 py-3 text-left">
          <p className="text-sm text-amber-300">
            설정에서 모션 권한을 허용해주세요
          </p>
        </div>
      )}

      {!isCameraDenied && !isOrientationDenied && (
        <>
          {isOrientationOnly && (
            <div className="mb-4 rounded-xl bg-sky-500/10 px-4 py-3 text-left">
              <p className="text-sm text-sky-300">나침반이 없는 기기입니다. 마우스로 하늘을 탐색할 수 있어요.</p>
            </div>
          )}
          <button
            onClick={onRequest}
            disabled={isRequesting}
            className="rounded-2xl bg-sky-500 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-sky-400 disabled:opacity-50"
          >
            {isRequesting ? "권한 요청 중…" : isOrientationOnly ? "카메라로 시작하기" : "시작하기"}
          </button>
        </>
      )}

      <p className="mt-6 text-xs text-white/25">
        별자리 위치는 약 10-20° 오차가 있을 수 있습니다
      </p>
    </div>
  );
}
