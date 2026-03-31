import { Sunrise, Sunset } from "lucide-react";

interface Props {
  sunrise: number;
  sunset: number;
}

function formatTime(unix: number): string {
  const d = new Date(unix * 1000);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  return `${period} ${h % 12 || 12}:${m}`;
}

export function SunArcCard({ sunrise, sunset }: Props) {
  const now = Date.now() / 1000;
  const dayLength = sunset - sunrise;
  const progress = Math.max(0, Math.min(1, (now - sunrise) / dayLength));
  const isDaytime = now >= sunrise && now <= sunset;

  // Arc geometry: shallow elliptical arc
  const cx = 150;
  const cy = 75;
  const rx = 125;
  const ry = 55;

  // Sun position along the arc (0 = sunrise/left, 1 = sunset/right)
  const angle = Math.PI * (1 - progress);
  const sunX = cx + rx * Math.cos(angle);
  const sunY = cy - ry * Math.sin(angle);

  const arcStartX = cx - rx;
  const arcEndX = cx + rx;

  const arcPath = `M ${arcStartX} ${cy} A ${rx} ${ry} 0 0 1 ${arcEndX} ${cy}`;

  const litArcPath = isDaytime
    ? `M ${arcStartX} ${cy} A ${rx} ${ry} 0 0 1 ${sunX} ${sunY}`
    : now >= sunset
      ? arcPath
      : "";

  return (
    <div className="animate-slide-up-delay-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
      <h3 className="mb-2 text-xs font-medium tracking-wide text-white/60 uppercase">
        일출 · 일몰
      </h3>

      <div className="relative mx-auto" style={{ maxWidth: 300 }}>
        <svg viewBox="0 0 300 95" className="w-full">
          {/* Horizon line */}
          <line
            x1="20"
            y1={cy}
            x2="280"
            y2={cy}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />

          {/* Full arc trajectory (dashed) */}
          <path
            d={arcPath}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Lit arc (traveled portion) */}
          {litArcPath && (
            <path
              d={litArcPath}
              fill="none"
              stroke="url(#sunGradient)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
            </linearGradient>
            <radialGradient id="sunGlow">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sun glow */}
          {isDaytime && (
            <circle cx={sunX} cy={sunY} r="18" fill="url(#sunGlow)" />
          )}

          {/* Sun circle */}
          {isDaytime && (
            <circle
              cx={sunX}
              cy={sunY}
              r="6"
              fill="#fbbf24"
              className="drop-shadow-sm"
            />
          )}

          {/* Moon (after sunset) */}
          {now >= sunset && (
            <circle
              cx={arcEndX}
              cy={cy - 8}
              r="4"
              fill="#94a3b8"
              opacity="0.7"
            />
          )}

          {/* Sunrise label */}
          <text
            x={arcStartX}
            y={cy + 14}
            textAnchor="middle"
            className="fill-white/40 text-[9px]"
          >
            일출
          </text>

          {/* Sunset label */}
          <text
            x={arcEndX}
            y={cy + 14}
            textAnchor="middle"
            className="fill-white/40 text-[9px]"
          >
            일몰
          </text>
        </svg>
      </div>

      {/* Times */}
      <div className="mt-1 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Sunrise className="h-4 w-4 text-amber-400/70" />
          <span className="text-sm text-white/70">{formatTime(sunrise)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sunset className="h-4 w-4 text-orange-400/70" />
          <span className="text-sm text-white/70">{formatTime(sunset)}</span>
        </div>
      </div>
    </div>
  );
}
