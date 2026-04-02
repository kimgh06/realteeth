import { useQuery } from "@tanstack/react-query";
import { OWM_BASE_URL, USE_MOCK } from "@/shared/config";

export interface AqGrade {
  label: string;
  color: string;
}

export interface AirQualityData {
  aqi: number;
  pm2_5: number;
  pm10: number;
  pm25Grade: AqGrade;
  pm10Grade: AqGrade;
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

// 한국 환경부 PM2.5 기준 (µg/m³)
function gradeFromPM25(v: number): AqGrade {
  if (v <= 15) return { label: "좋음", color: "#4CAF50" };
  if (v <= 35) return { label: "보통", color: "#8BC34A" };
  if (v <= 75) return { label: "나쁨", color: "#FF9800" };
  return { label: "매우나쁨", color: "#F44336" };
}

// 한국 환경부 PM10 기준 (µg/m³)
function gradeFromPM10(v: number): AqGrade {
  if (v <= 30) return { label: "좋음", color: "#4CAF50" };
  if (v <= 80) return { label: "보통", color: "#8BC34A" };
  if (v <= 150) return { label: "나쁨", color: "#FF9800" };
  return { label: "매우나쁨", color: "#F44336" };
}

function mockAirQuality(): AirQualityData {
  const pm2_5 = 15.2;
  const pm10 = 28.5;
  return { aqi: 2, pm2_5, pm10, pm25Grade: gradeFromPM25(pm2_5), pm10Grade: gradeFromPM10(pm10) };
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

  const pm2_5 = Math.round(item.components.pm2_5 * 10) / 10;
  const pm10 = Math.round(item.components.pm10 * 10) / 10;

  return {
    aqi: item.main.aqi,
    pm2_5,
    pm10,
    pm25Grade: gradeFromPM25(pm2_5),
    pm10Grade: gradeFromPM10(pm10),
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
