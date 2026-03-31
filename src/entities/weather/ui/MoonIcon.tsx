import { getMoonPhase } from "@/shared/lib/moonPhase";

interface Props {
  size: number;
  className?: string;
  overrideAge?: number;
}

const SYNODIC = 29.53059;
const HALF = SYNODIC / 2;

const PHASE_LABELS: [number, string][] = [
  [1.85, "신월"],
  [7.38, "초승달"],
  [9.23, "상현달"],
  [14.77, "차오르는 달"],
  [16.61, "보름달"],
  [22.15, "기우는 달"],
  [23.99, "하현달"],
  [27.68, "그믐달"],
];

function getLabelFromAge(age: number): string {
  for (const [threshold, label] of PHASE_LABELS) {
    if (age < threshold) return label;
  }
  return "신월";
}

export function MoonIcon({ size, className = "", overrideAge }: Props) {
  const phase = getMoonPhase();
  const effectiveAge = overrideAge ?? phase.age;

  const nearFull = Math.abs(effectiveAge - HALF) <= 1;
  const label = overrideAge != null ? getLabelFromAge(effectiveAge) : phase.label;

  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  const distFromNew = effectiveAge <= HALF ? effectiveAge : SYNODIC - effectiveAge;
  const fraction = distFromNew / HALF; // 0=new, 1=full

  const terminatorRx = Math.abs(1 - fraction * 2) * r;

  const isWaxing = effectiveAge <= HALF;
  const pastQuarter = fraction > 0.5;

  const litPath = buildLitPath(cx, cy, r, terminatorRx, isWaxing, pastQuarter);
  const uid = `moon-${size}-${Math.round(effectiveAge * 10)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={`clip-${uid}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <clipPath id={`clip-lit-${uid}`}>
          <path d={litPath} />
        </clipPath>
      </defs>

      {/* Dotted outline circle */}
      <circle
        cx={cx} cy={cy} r={r + 3}
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />

      {/* Moon glow */}
      <circle cx={cx} cy={cy} r={r + 4} fill="rgba(203,213,225,0.06)" />

      {/* Dark base */}
      <circle cx={cx} cy={cy} r={r} fill="#0f172a" />

      {/* Lit area */}
      <path d={litPath} fill="#f1f5f9" clipPath={`url(#clip-${uid})`} />

      {/* Surface details (only on lit area) */}
      <g clipPath={`url(#clip-lit-${uid})`}>
        {nearFull ? (
          <g opacity="0.2" transform={`translate(${cx * 2}, 0) scale(-1, 1)`}>
            {/* Rabbit facing right (mirrored) */}
            <ellipse cx={cx + r * 0.05} cy={cy + r * 0.2} rx={r * 0.22} ry={r * 0.28} fill="#90a4ae" />
            <circle cx={cx + r * 0.05} cy={cy - r * 0.15} r={r * 0.15} fill="#90a4ae" />
            <ellipse cx={cx - r * 0.08} cy={cy - r * 0.48} rx={r * 0.06} ry={r * 0.2} fill="#90a4ae" transform={`rotate(-10 ${cx - r * 0.08} ${cy - r * 0.48})`} />
            <ellipse cx={cx + r * 0.18} cy={cy - r * 0.45} rx={r * 0.06} ry={r * 0.22} fill="#90a4ae" transform={`rotate(15 ${cx + r * 0.18} ${cy - r * 0.45})`} />
            <ellipse cx={cx - r * 0.3} cy={cy + r * 0.3} rx={r * 0.12} ry={r * 0.08} fill="#90a4ae" />
            <line x1={cx - r * 0.15} y1={cy + r * 0.05} x2={cx - r * 0.35} y2={cy + r * 0.25} stroke="#90a4ae" strokeWidth={r * 0.04} strokeLinecap="round" />
          </g>
        ) : (
          <g opacity="0.4">
            <circle cx={cx - r * 0.25} cy={cy - r * 0.3} r={r * 0.12} fill="#94a3b8" />
            <circle cx={cx + r * 0.3} cy={cy - r * 0.1} r={r * 0.08} fill="#94a3b8" />
            <circle cx={cx - r * 0.05} cy={cy + r * 0.35} r={r * 0.15} fill="#94a3b8" />
            <circle cx={cx + r * 0.35} cy={cy + r * 0.3} r={r * 0.06} fill="#94a3b8" />
            <circle cx={cx - r * 0.4} cy={cy + r * 0.05} r={r * 0.07} fill="#94a3b8" />
            <circle cx={cx + r * 0.1} cy={cy - r * 0.55} r={r * 0.05} fill="#94a3b8" />
            <circle cx={cx + r * 0.15} cy={cy + r * 0.55} r={r * 0.09} fill="#94a3b8" />
          </g>
        )}
      </g>
    </svg>
  );
}

function buildLitPath(
  cx: number, cy: number, r: number,
  terminatorRx: number,
  isWaxing: boolean,
  pastQuarter: boolean,
): string {
  const top = cy - r;
  const bot = cy + r;

  // New moon: nothing lit
  if (terminatorRx >= r * 0.95 && !pastQuarter) {
    return "";
  }

  // Full moon: everything lit
  if (terminatorRx >= r * 0.95 && pastQuarter) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`;
  }

  if (isWaxing) {
    // Waxing: right side lit. Semicircle clockwise (right).
    // pastQuarter: terminator bulges out (sweep=1), pre-quarter: inward (sweep=0)
    const sweepTerm = pastQuarter ? 1 : 0;
    return `M ${cx} ${top} A ${r} ${r} 0 0 1 ${cx} ${bot} A ${terminatorRx} ${r} 0 0 ${sweepTerm} ${cx} ${top}`;
  } else {
    // Waning: left side lit. Semicircle counter-clockwise (left).
    // Sweep is REVERSED vs waxing because the semicircle direction flipped
    const sweepTerm = pastQuarter ? 0 : 1;
    return `M ${cx} ${top} A ${r} ${r} 0 0 0 ${cx} ${bot} A ${terminatorRx} ${r} 0 0 ${sweepTerm} ${cx} ${top}`;
  }
}
