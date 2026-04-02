const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

function degToDir(deg: number): string {
  return DIRS[Math.round(deg / 45) % 8]!;
}

const CARDINALS = [
  { label: "N", x: 36, y: 9 },
  { label: "E", x: 63, y: 39 },
  { label: "S", x: 36, y: 66 },
  { label: "W", x: 9, y: 39 },
] as const;

interface Props {
  deg: number;
  speed: number;
}

export function WindCompass({ deg, speed }: Props) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/8 py-3">
      <svg width="72" height="72" viewBox="0 0 72 72">
        {/* Outer ring */}
        <circle
          cx="36" cy="36" r="30"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Tick marks at 45° intervals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const rad = (a - 90) * (Math.PI / 180);
          return (
            <line
              key={a}
              x1={36 + 26 * Math.cos(rad)} y1={36 + 26 * Math.sin(rad)}
              x2={36 + 22 * Math.cos(rad)} y2={36 + 22 * Math.sin(rad)}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />
          );
        })}
        {/* Cardinal labels */}
        {CARDINALS.map(({ label, x, y }) => (
          <text
            key={label}
            x={x} y={y}
            textAnchor="middle"
            fontSize="9"
            fill="rgba(255,255,255,0.5)"
          >
            {label}
          </text>
        ))}
        {/* Directional arrow */}
        <g transform={`rotate(${deg}, 36, 36)`}>
          {/* Head — direction wind is blowing TO */}
          <polygon points="36,12 32.5,28 39.5,28" fill="#60a5fa" opacity="0.9" />
          {/* Tail */}
          <polygon points="36,60 32.5,44 39.5,44" fill="rgba(255,255,255,0.2)" />
          <circle cx="36" cy="36" r="3" fill="rgba(255,255,255,0.35)" />
        </g>
      </svg>
      <span className="text-sm font-medium text-white">{speed} m/s</span>
      <span className="text-xs text-white/60">바람 ({degToDir(deg)})</span>
    </div>
  );
}
