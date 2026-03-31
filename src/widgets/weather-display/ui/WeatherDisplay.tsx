import { useState, useEffect } from "react";
import { WeatherIcon } from "@/entities/weather/ui/WeatherIcon";
import { TemperatureDisplay } from "@/entities/weather/ui/TemperatureDisplay";
import { WeatherSkeleton } from "@/shared/ui/Skeleton";
import { ErrorCard } from "@/shared/ui/ErrorCard";
import { Eye, Gauge } from "lucide-react";
import { SunArcCard } from "@/widgets/sun-arc/ui/SunArcCard";
import { AirQualityCard } from "@/widgets/air-quality/ui/AirQualityCard";
import type { WeatherData } from "@/entities/weather";
import type { AirQualityData } from "@/entities/weather/api/airPollutionApi";

interface Props {
  data: WeatherData | undefined;
  isLoading: boolean;
  error: Error | null;
  locationName?: string;
  onRetry?: () => void;
  airData?: AirQualityData;
  airLoading?: boolean;
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const WIND_DIRS = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"] as const;
function getWindDirection(deg: number): string {
  return WIND_DIRS[Math.round(deg / 45) % 8]!;
}

function DateTimeLine() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const month = now.getMonth() + 1;
  const day = now.getDate();
  const dayName = DAY_NAMES[now.getDay()]!;
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const period = hours < 12 ? "오전" : "오후";
  const displayHour = hours % 12 || 12;

  return (
    <span className="text-xs text-white/50">
      {month}월 {day}일 ({dayName}) {period} {displayHour}:{minutes} 기준
    </span>
  );
}

export function WeatherDisplay({ data, isLoading, error, locationName, onRetry, airData, airLoading }: Props) {
  if (isLoading) {
    return <WeatherSkeleton />;
  }

  if (error) {
    return <ErrorCard onRetry={onRetry} />;
  }

  if (!data) return null;

  const { current, hourly, daily } = data;
  const name = locationName ?? current.locationName;

  return (
    <div className="space-y-4">
      {/* Hero: Current Weather */}
      <div className="animate-slide-up pb-4 pt-20 text-center sm:pt-24 sm:pb-6">
        <DateTimeLine />
        <h2
          className="mt-2 mb-0.5 text-xl font-medium text-white/90"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
        >
          {name}
        </h2>
        <p className="mb-1 text-sm capitalize text-white/60">
          {current.description}
        </p>

        <div className="mt-4 flex items-center justify-center">
          <WeatherIcon
            icon={current.icon}
            size="xl"
            description={current.description}
          />
        </div>

        <TemperatureDisplay
          temp={current.temp}
          className="text-[80px] leading-none font-extralight tracking-tight text-white sm:text-[96px]"
        />

        <p className="mt-1 text-sm text-white/50">
          최저 {current.tempMin}° / 최고 {current.tempMax}°
        </p>
        <p className="mt-2 text-xs text-white/40">
          체감 {current.feelsLike}° · 습도 {current.humidity}% · {current.windDeg != null ? getWindDirection(current.windDeg) + "풍 " : "바람 "}{current.windSpeed}m/s
        </p>
      </div>

      {/* Hourly Forecast */}
      <div className="animate-slide-up-delay-1 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
        <h3 className="mb-3 text-xs font-medium tracking-wide text-white/60 uppercase">
          시간대별 기온
        </h3>
        <div className="hide-scrollbar flex gap-0 overflow-x-auto">
          {/* "지금" */}
          <div className="flex shrink-0 flex-col items-center gap-1 border-r border-white/10 px-3 py-1.5 sm:px-4">
            <span className="text-[11px] font-medium text-white/80">지금</span>
            <WeatherIcon icon={current.icon} size="sm" description={current.description} />
            <TemperatureDisplay
              temp={current.temp}
              className="text-sm font-medium text-white"
            />
          </div>

          {hourly.map((h, i) => {
            const date = new Date(h.dt * 1000);
            const hour = date.getHours();
            return (
              <div
                key={h.dt}
                className={`flex shrink-0 flex-col items-center gap-1 px-3 py-1.5 sm:px-4 ${
                  i < hourly.length - 1 ? "border-r border-white/10" : ""
                }`}
              >
                <span className="text-[11px] text-white/50">{hour}시</span>
                <WeatherIcon icon={h.icon} size="sm" description={h.description} />
                <TemperatureDisplay
                  temp={h.temp}
                  className="text-sm font-medium text-white/90"
                />
                {h.pop != null && h.pop > 0 && (
                  <span className="text-[10px] text-sky-300">{h.pop}%</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Air Quality */}
      <AirQualityCard data={airData} isLoading={airLoading ?? false} />

      {/* Daily Forecast */}
      {daily.length > 0 && (
        <div className="animate-slide-up-delay-2 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
          <h3 className="mb-3 text-xs font-medium tracking-wide text-white/60 uppercase">
            주간 예보
          </h3>
          <div className="space-y-2.5">
            {(() => {
              const tempRange = daily.reduce(
                (acc, day) => ({
                  min: Math.min(acc.min, day.tempMin),
                  max: Math.max(acc.max, day.tempMax),
                }),
                { min: Infinity, max: -Infinity },
              );
              const rangeWidth = tempRange.max - tempRange.min || 1;
              return daily.map((d) => {
              const leftPct = ((d.tempMin - tempRange.min) / rangeWidth) * 100;
              const widthPct = ((d.tempMax - d.tempMin) / rangeWidth) * 100;

              return (
                <div key={d.date} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-sm text-white/70">{d.dayName}</span>
                  <WeatherIcon icon={d.icon} size="sm" description={d.description} />
                  {d.pop > 0 && (
                    <span className="w-8 shrink-0 text-[11px] text-sky-300">{d.pop}%</span>
                  )}
                  {d.pop === 0 && <span className="w-8 shrink-0" />}
                  <span className="w-8 shrink-0 text-right text-sm text-white/50">
                    {d.tempMin}°
                  </span>
                  <div className="relative h-1 flex-1 rounded-full bg-white/10">
                    <div
                      className="absolute h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(widthPct, 8)}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-sm text-white">
                    {d.tempMax}°
                  </span>
                </div>
              );
            });
            })()}
          </div>
        </div>
      )}

      {/* Sun Arc */}
      {current.sunrise != null && current.sunset != null && (
        <SunArcCard sunrise={current.sunrise} sunset={current.sunset} />
      )}

      {/* Detail Pills (visibility + pressure only) */}
      {(current.visibility != null || current.pressure != null) && (
        <div className="animate-slide-up-delay-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
          <h3 className="mb-3 text-xs font-medium tracking-wide text-white/60 uppercase">
            상세 정보
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {current.visibility != null && (
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/8 py-3">
                <Eye className="h-5 w-5 text-white/50" />
                <span className="text-lg font-light text-white">
                  {current.visibility >= 1000
                    ? `${(current.visibility / 1000).toFixed(1)}km`
                    : `${current.visibility}m`}
                </span>
                <span className="text-[11px] text-white/50">가시거리</span>
              </div>
            )}
            {current.pressure != null && (
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/8 py-3">
                <Gauge className="h-5 w-5 text-white/50" />
                <span className="text-base font-light text-white">{current.pressure}</span>
                <span className="text-[11px] text-white/50">기압 hPa</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
