import districts from "@/shared/data/korea_districts.json";
import type { District } from "@/shared/model/district";

export interface DistrictEntry {
  district: District;
  segments: string[];
  nameLower: string;
  depth: number;
}

export interface SearchResult {
  district: District;
  score: number;
  depth: number;
}

let index: DistrictEntry[] | null = null;
const cache = new Map<string, District[]>();
const CACHE_TTL = 30_000;
const cacheTimestamp = new Map<string, number>();

function buildIndex(): DistrictEntry[] {
  if (index) return index;
  index = (districts as District[]).map((d) => ({
    district: d,
    segments: [...d.name.split(" "), d.name],
    nameLower: d.name.toLowerCase(),
    depth: d.name.split(" ").length - 1,
  }));
  return index;
}

function score(entry: DistrictEntry, q: string): number {
  const { nameLower } = entry;
  if (nameLower === q) return 100;
  for (const seg of entry.segments) {
    if (seg.toLowerCase() === q) return 90;
  }
  for (const seg of entry.segments) {
    if (seg.toLowerCase().startsWith(q)) return 80;
  }
  if (nameLower.startsWith(q)) return 70;
  for (const seg of entry.segments) {
    if (seg.toLowerCase().includes(q)) return 60;
  }
  if (nameLower.includes(q)) return 50;
  return 0;
}

export function searchDistricts(query: string, limit = 20): District[] {
  const idx = buildIndex();
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const now = Date.now();
  const cached = cache.get(q);
  const ts = cacheTimestamp.get(q);
  if (cached && ts && now - ts < CACHE_TTL) return cached;

  const terms = q.split(/\s+/).filter(Boolean);
  const scored: SearchResult[] = [];

  for (const entry of idx) {
    let totalScore = 0;
    let allMatch = true;
    for (const term of terms) {
      const s = score(entry, term);
      if (s === 0) {
        allMatch = false;
        break;
      }
      totalScore += s;
    }
    if (allMatch) {
      scored.push({ district: entry.district, score: totalScore, depth: entry.depth });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.depth - b.depth;
  });

  const result = scored.slice(0, limit).map((s) => s.district);
  cache.set(q, result);
  cacheTimestamp.set(q, now);
  return result;
}

export function findNearestDistrict(lat: number, lon: number): District | null {
  const idx = buildIndex();
  let best: District | null = null;
  let bestDist = Infinity;
  for (const entry of idx) {
    const d = entry.district;
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

export function clearCache(): void {
  cache.clear();
  cacheTimestamp.clear();
}
