import type { WeatherData } from "../model/types";

export function mockWeatherData(name?: string): WeatherData {
  const now = Math.floor(Date.now() / 1000);
  return {
    current: {
      temp: 18,
      tempMin: 12,
      tempMax: 22,
      feelsLike: 17,
      humidity: 55,
      description: "맑음",
      icon: "01d",
      windSpeed: 3.2,
      locationName: name ?? "서울특별시",
      sunrise: now - 3600 * 6,
      sunset: now + 3600 * 6,
      pressure: 1013,
      visibility: 10000,
      clouds: 20,
    },
    hourly: Array.from({ length: 8 }, (_, i) => ({
      dt: now + i * 3600 * 3,
      temp: 15 + Math.round(Math.sin(i / 2) * 5),
      icon: i < 4 ? "01d" : "02n",
      description: i < 4 ? "맑음" : "구름 조금",
      pop: i < 3 ? 0 : Math.round(Math.random() * 50),
    })),
    daily: Array.from({ length: 5 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      return {
        date: d.toISOString().slice(0, 10),
        dayName: dayNames[d.getDay()]!,
        tempMin: 10 + Math.round(Math.random() * 5),
        tempMax: 18 + Math.round(Math.random() * 7),
        icon: ["01d", "02d", "03d", "10d", "01d"][i]!,
        description: ["맑음", "구름 조금", "흐림", "비", "맑음"][i]!,
        pop: [0, 10, 30, 80, 5][i]!,
      };
    }),
    timezoneOffset: 32400, // KST (UTC+9)
  };
}
