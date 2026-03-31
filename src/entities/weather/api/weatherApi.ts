import { useQuery } from "@tanstack/react-query";
import { OWM_BASE_URL, USE_MOCK } from "@/shared/config";
import type {
  WeatherData,
  DailyForecast,
  OWMCurrentResponse,
  OWMForecastResponse,
} from "../model/types";
import { mockWeatherData } from "./mockData";
import { getWeatherDescription } from "@/shared/lib/weatherDescription";

async function fetchCurrentWeather(
  lat: number,
  lon: number,
): Promise<OWMCurrentResponse> {
  const res = await fetch(
    `${OWM_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=kr`,
  );
  if (!res.ok) throw new Error("날씨 정보를 불러올 수 없습니다.");
  return res.json();
}

async function fetchForecast(
  lat: number,
  lon: number,
): Promise<OWMForecastResponse> {
  const res = await fetch(
    `${OWM_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=kr`,
  );
  if (!res.ok) throw new Error("예보 정보를 불러올 수 없습니다.");
  return res.json();
}

const KST_DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function deriveDailyForecast(
  forecast: OWMForecastResponse,
): DailyForecast[] {
  const grouped = new Map<
    string,
    { temps_min: number[]; temps_max: number[]; icons: string[]; descs: string[]; pops: number[] }
  >();

  const todayKST = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const todayStr = `${todayKST.getFullYear()}-${String(todayKST.getMonth() + 1).padStart(2, "0")}-${String(todayKST.getDate()).padStart(2, "0")}`;

  for (const item of forecast.list) {
    const kstDate = new Date(
      new Date(item.dt * 1000).toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
    );
    const key = `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, "0")}-${String(kstDate.getDate()).padStart(2, "0")}`;

    if (key === todayStr) continue;

    if (!grouped.has(key)) {
      grouped.set(key, { temps_min: [], temps_max: [], icons: [], descs: [], pops: [] });
    }
    const g = grouped.get(key)!;
    g.temps_min.push(item.main.temp_min);
    g.temps_max.push(item.main.temp_max);
    g.icons.push(item.weather[0]?.icon ?? "01d");
    g.descs.push(item.weather[0] ? getWeatherDescription(item.weather[0].id) : "");
    g.pops.push(item.pop);
  }

  const result: DailyForecast[] = [];
  for (const [dateStr, g] of grouped) {
    const d = new Date(dateStr + "T12:00:00+09:00");
    const dayName = KST_DAY_NAMES[d.getDay()]!;

    // Pick noon icon (12:00-15:00 interval) or most common
    const noonIdx = g.icons.length >= 4 ? 3 : Math.floor(g.icons.length / 2);
    const icon = g.icons[noonIdx] ?? g.icons[0] ?? "01d";
    const desc = g.descs[noonIdx] ?? g.descs[0] ?? "";

    result.push({
      date: dateStr,
      dayName,
      tempMin: Math.round(Math.min(...g.temps_min)),
      tempMax: Math.round(Math.max(...g.temps_max)),
      icon,
      description: desc,
      pop: Math.round(Math.max(...g.pops) * 100),
    });
  }

  return result.slice(0, 5);
}

async function getWeatherData(
  lat: number,
  lon: number,
  name?: string,
): Promise<WeatherData> {
  if (USE_MOCK) return mockWeatherData(name);

  const [current, forecast] = await Promise.all([
    fetchCurrentWeather(lat, lon),
    fetchForecast(lat, lon),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayForecasts = forecast.list.filter((item) => {
    const d = new Date(item.dt * 1000);
    return d >= todayStart && d <= todayEnd;
  });

  const allTodayTemps = [
    current.main.temp,
    ...todayForecasts.map((f) => f.main.temp),
  ];

  return {
    current: {
      temp: Math.round(current.main.temp),
      tempMin: Math.round(Math.min(...allTodayTemps)),
      tempMax: Math.round(Math.max(...allTodayTemps)),
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      description: current.weather[0] ? getWeatherDescription(current.weather[0].id) : "",
      icon: current.weather[0]?.icon ?? "01d",
      windSpeed: current.wind.speed,
      windDeg: current.wind.deg,
      locationName: name ?? current.name,
      sunrise: current.sys.sunrise,
      sunset: current.sys.sunset,
      pressure: current.main.pressure,
      visibility: current.visibility,
      clouds: current.clouds.all,
    },
    hourly: forecast.list.slice(0, 8).map((item) => ({
      dt: item.dt,
      temp: Math.round(item.main.temp),
      icon: item.weather[0]?.icon ?? "01d",
      description: item.weather[0] ? getWeatherDescription(item.weather[0].id) : "",
      pop: Math.round(item.pop * 100),
    })),
    daily: deriveDailyForecast(forecast),
  };
}

export function useWeather(
  lat: number | null,
  lon: number | null,
  name?: string,
) {
  return useQuery({
    queryKey: ["weather", lat, lon],
    queryFn: () => getWeatherData(lat!, lon!, name),
    enabled: lat !== null && lon !== null,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useWeatherSummary(
  lat: number | null,
  lon: number | null,
  name?: string,
) {
  return useQuery({
    queryKey: ["weather", lat, lon],
    queryFn: () => getWeatherData(lat!, lon!, name),
    enabled: lat !== null && lon !== null,
    refetchInterval: 5 * 60 * 1000,
    select: (data) => data.current,
  });
}
