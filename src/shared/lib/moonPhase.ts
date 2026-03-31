// Moon phase calculation based on synodic month
// Synodic month ≈ 29.53059 days
// Reference new moon: Jan 6, 2000 18:14 UTC

const SYNODIC_MONTH = 29.53059;
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0) / 1000; // Unix timestamp

export type MoonPhaseName =
  | "new" // 삭 (신월)
  | "waxing-crescent" // 초승달
  | "first-quarter" // 상현달
  | "waxing-gibbous" // 상현망간
  | "full" // 보름달
  | "waning-gibbous" // 하현망간
  | "last-quarter" // 하현달
  | "waning-crescent"; // 그믐달

export interface MoonPhase {
  phase: MoonPhaseName;
  label: string;
  age: number; // days into cycle (0-29.5)
  illumination: number; // 0-100%
  nearFull: boolean; // within ±1 day of full moon (for rabbit silhouette)
}

const PHASE_LABELS: Record<MoonPhaseName, string> = {
  new: "신월",
  "waxing-crescent": "초승달",
  "first-quarter": "상현달",
  "waxing-gibbous": "차오르는 달",
  full: "보름달",
  "waning-gibbous": "기우는 달",
  "last-quarter": "하현달",
  "waning-crescent": "그믐달",
};

export function getMoonPhase(timestamp?: number): MoonPhase {
  const now = timestamp ?? Date.now() / 1000;
  const daysSinceRef = (now - REFERENCE_NEW_MOON) / 86400;
  const age = ((daysSinceRef % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

  // Illumination: approximate with cosine
  const illumination = Math.round(
    (1 - Math.cos((age / SYNODIC_MONTH) * 2 * Math.PI)) * 50,
  );

  // Phase name based on age
  let phase: MoonPhaseName;
  if (age < 1.85) phase = "new";
  else if (age < 7.38) phase = "waxing-crescent";
  else if (age < 9.23) phase = "first-quarter";
  else if (age < 14.77) phase = "waxing-gibbous";
  else if (age < 16.61) phase = "full";
  else if (age < 22.15) phase = "waning-gibbous";
  else if (age < 23.99) phase = "last-quarter";
  else if (age < 27.68) phase = "waning-crescent";
  else phase = "new";

  // Full moon center ≈ day 14.77. Near full = ±1 day
  const fullMoonCenter = SYNODIC_MONTH / 2;
  const nearFull = Math.abs(age - fullMoonCenter) <= 1;

  return {
    phase,
    label: PHASE_LABELS[phase],
    age: Math.round(age * 10) / 10,
    illumination,
    nearFull,
  };
}
