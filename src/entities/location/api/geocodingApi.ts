import type { District } from "@/shared/model/district";

interface OWMGeoResult {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export async function geocodeQuery(query: string): Promise<District[]> {
  const res = await fetch(
    `/api/geo/direct?q=${encodeURIComponent(query)}&limit=8`,
  );
  if (!res.ok) throw new Error("검색 실패");
  const data: OWMGeoResult[] = await res.json();
  return data.map((item) => ({
    code: `geo_${item.lat.toFixed(4)}_${item.lon.toFixed(4)}`,
    name: [item.local_names?.ko ?? item.name, item.state, item.country]
      .filter(Boolean)
      .join(", "),
    lat: item.lat,
    lon: item.lon,
  }));
}
