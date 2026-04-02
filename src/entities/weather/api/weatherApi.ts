import { useQuery } from "@tanstack/react-query";
import { OWM_BASE_URL, USE_MOCK, DAY_NAMES } from "@/shared/config";
import type {
  WeatherData,
  DailyForecast,
  OWMCurrentResponse,
  OWMForecastResponse,
} from "../model/types";
import { mockWeatherData } from "./mockData";
import { getWeatherDescription } from "@/shared/lib/weatherDescription";

async function owmFetch<T>(url: string, errorMsg: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(errorMsg);
  return res.json() as Promise<T>;
}

const fetchCurrentWeather = (lat: number, lon: number) =>
  owmFetch<OWMCurrentResponse>(
    `${OWM_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=kr`,
    "날씨 정보를 불러올 수 없습니다.",
  );

const fetchForecast = (lat: number, lon: number) =>
  owmFetch<OWMForecastResponse>(
    `${OWM_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=kr`,
    "예보 정보를 불러올 수 없습니다.",
  );


// Returns a Date where UTC accessors (getUTCHours, getUTCDate, etc.) give local time
function toLocalDate(utcUnix: number, offsetSec: number): Date {
  return new Date((utcUnix + offsetSec) * 1000);
}

function localDateStr(utcUnix: number, offsetSec: number): string {
  const d = toLocalDate(utcUnix, offsetSec);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function deriveDailyForecast(
  forecast: OWMForecastResponse,
  timezoneOffset: number,
): DailyForecast[] {
  const nowUnix = Math.floor(Date.now() / 1000);
  const todayStr = localDateStr(nowUnix, timezoneOffset);

  const grouped = new Map<
    string,
    { temps_min: number[]; temps_max: number[]; icons: string[]; descs: string[]; pops: number[]; dayOfWeek: number }
  >();

  for (const item of forecast.list) {
    const key = localDateStr(item.dt, timezoneOffset);
    if (key === todayStr) continue;

    if (!grouped.has(key)) {
      const d = toLocalDate(item.dt, timezoneOffset);
      grouped.set(key, { temps_min: [], temps_max: [], icons: [], descs: [], pops: [], dayOfWeek: d.getUTCDay() });
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
    const dayName = DAY_NAMES[g.dayOfWeek]!;
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

  const timezoneOffset = current.timezone;
  const nowUnix = Math.floor(Date.now() / 1000);
  const todayStr = localDateStr(nowUnix, timezoneOffset);

  const todayForecasts = forecast.list.filter(
    (item) => localDateStr(item.dt, timezoneOffset) === todayStr,
  );

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
    daily: deriveDailyForecast(forecast, timezoneOffset),
    timezoneOffset,
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
