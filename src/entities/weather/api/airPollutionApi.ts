import { useQuery } from "@tanstack/react-query";
import { OWM_BASE_URL, USE_MOCK } from "@/shared/config";

export interface AirQualityData {
  aqi: number;
  pm2_5: number;
  pm10: number;
  label: string;
  color: string;
}

interface OWMAirPollutionResponse {
  list: {
    main: { aqi: number };
    components: {
      pm2_5: number;
      pm10: number;
    };
  }[];
}

const AQI_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "좋음", color: "#4CAF50" },
  2: { label: "보통", color: "#8BC34A" },
  3: { label: "나쁨", color: "#FF9800" },
  4: { label: "매우나쁨", color: "#F44336" },
  5: { label: "위험", color: "#9C27B0" },
};

function mockAirQuality(): AirQualityData {
  return { aqi: 2, pm2_5: 15.2, pm10: 28.5, label: "보통", color: "#8BC34A" };
}

async function fetchAirPollution(
  lat: number,
  lon: number,
): Promise<AirQualityData> {
  if (USE_MOCK) return mockAirQuality();

  const res = await fetch(
    `${OWM_BASE_URL}/air_pollution?lat=${lat}&lon=${lon}`,
  );
  if (!res.ok) throw new Error("대기질 정보를 불러올 수 없습니다.");
  const data: OWMAirPollutionResponse = await res.json();

  const item = data.list[0];
  if (!item) throw new Error("대기질 데이터가 없습니다.");

  const aqi = item.main.aqi;
  const info = AQI_LABELS[aqi] ?? { label: "알 수 없음", color: "#9E9E9E" };

  return {
    aqi,
    pm2_5: Math.round(item.components.pm2_5 * 10) / 10,
    pm10: Math.round(item.components.pm10 * 10) / 10,
    label: info.label,
    color: info.color,
  };
}

export function useAirQuality(lat: number | null, lon: number | null) {
  return useQuery({
    queryKey: ["air-quality", lat, lon],
    queryFn: () => fetchAirPollution(lat!, lon!),
    enabled: lat !== null && lon !== null,
    refetchInterval: 10 * 60 * 1000,
  });
}
