import { Telescope } from "lucide-react";
import type { PermissionState } from "../model/types";

interface Props {
  orientationPermission: PermissionState;
  onRequest: () => void;
}

export function PermissionGate({ orientationPermission, onRequest }: Props) {
  const isOrientationDenied = orientationPermission === "denied";
  const isRequesting = orientationPermission === "requesting";

  if (!window.isSecureContext) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0d1b2a] px-8 text-center">
        <Telescope className="mb-6 h-16 w-16 text-white/30" />
        <h1 className="mb-2 text-xl font-semibold text-white">별자리 찾기</h1>
        <p className="text-sm text-white/50">HTTPS 환경에서만 사용할 수 있습니다</p>
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
        기기 방향 권한이 필요합니다
      </p>

      {isOrientationDenied && (
        <div className="mb-4 rounded-xl bg-amber-500/15 px-4 py-3 text-left">
          <p className="text-sm text-amber-300">
            설정에서 모션 권한을 허용해주세요
          </p>
        </div>
      )}

      {!isOrientationDenied && (
        <button
          onClick={onRequest}
          disabled={isRequesting}
          className="rounded-2xl bg-sky-500 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-sky-400 disabled:opacity-50"
        >
          {isRequesting ? "권한 요청 중…" : "시작하기"}
        </button>
      )}

      <p className="mt-6 text-xs text-white/25">
        별자리 위치는 약 10-20° 오차가 있을 수 있습니다
      </p>
    </div>
  );
}
