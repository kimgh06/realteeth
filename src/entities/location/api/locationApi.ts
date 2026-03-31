import districts from "@/shared/data/korea_districts.json";
import type { District } from "../model/types";

const allDistricts: District[] = districts as District[];

// Precompute: split each name into searchable segments
const indexedDistricts = allDistricts.map((d) => ({
  district: d,
  // "서울특별시 종로구 청운효자동" → ["서울특별시", "종로구", "청운효자동", "서울특별시 종로구 청운효자동"]
  segments: [...d.name.split(" "), d.name],
  nameLower: d.name.toLowerCase(),
  // depth: 시도=0, 구군=1, 동=2 (for sorting)
  depth: d.name.split(" ").length - 1,
}));

function getScore(entry: (typeof indexedDistricts)[number], q: string): number {
  const { segments, nameLower } = entry;

  // Exact full match → highest
  if (nameLower === q) return 100;

  // A segment starts with the query (e.g. "종로" matches "종로구")
  for (const seg of segments) {
    if (seg.toLowerCase() === q) return 90;
  }

  for (const seg of segments) {
    if (seg.toLowerCase().startsWith(q)) return 80;
  }

  // Full name starts with query
  if (nameLower.startsWith(q)) return 70;

  // Any segment contains query
  for (const seg of segments) {
    if (seg.toLowerCase().includes(q)) return 60;
  }

  // Full name contains query
  if (nameLower.includes(q)) return 50;

  return 0;
}

export function findNearestDistrict(lat: number, lon: number): District | null {
  let best: District | null = null;
  let bestDist = Infinity;

  for (const d of allDistricts) {
    const dlat = d.lat - lat;
    const dlon = d.lon - lon;
    const dist = dlat * dlat + dlon * dlon;
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }

  return best;
}

export function searchDistricts(query: string): District[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Support multi-word search: "서울 종로" → ["서울", "종로"]
  const terms = q.split(/\s+/).filter(Boolean);

  const scored: { district: District; score: number; depth: number }[] = [];

  for (const entry of indexedDistricts) {
    // All terms must match
    let totalScore = 0;
    let allMatch = true;

    for (const term of terms) {
      const s = getScore(entry, term);
      if (s === 0) {
        allMatch = false;
        break;
      }
      totalScore += s;
    }

    if (allMatch) {
      scored.push({
        district: entry.district,
        score: totalScore,
        depth: entry.depth,
      });
    }
  }

  // Sort: higher score first, then shallower depth (시도 > 구군 > 동)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.depth - b.depth;
  });

  return scored.slice(0, 20).map((s) => s.district);
}
