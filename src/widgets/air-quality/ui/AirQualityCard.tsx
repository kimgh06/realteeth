import type { AirQualityData } from "@/entities/weather/api/airPollutionApi";

interface Props {
  data: AirQualityData | undefined;
  isLoading: boolean;
}

export function AirQualityCard({ data, isLoading }: Props) {
  if (isLoading || !data) return null;

  return (
    <div className="animate-slide-up-delay-4 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
      <h3 className="mb-3 text-xs font-medium tracking-wide text-white/60 uppercase">
        대기질
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {/* PM2.5 */}
        <div
          className="flex flex-col items-center gap-1 rounded-xl bg-white/8 py-3"
          style={{ border: `2.5px solid ${data.pm25Grade.color}99`, boxShadow: `0 0 12px ${data.pm25Grade.color}40` }}
        >
          <span className="text-xs font-semibold text-white/60">PM2.5</span>
          <span className="text-xl font-light text-white">
            {data.pm2_5} <span className="text-xs text-white/30">µg/m³</span>
          </span>
          <span className="text-sm font-bold" style={{ color: data.pm25Grade.color }}>
            {data.pm25Grade.label}
          </span>
        </div>

        {/* PM10 */}
        <div
          className="flex flex-col items-center gap-1 rounded-xl bg-white/8 py-3"
          style={{ border: `2.5px solid ${data.pm10Grade.color}99`, boxShadow: `0 0 12px ${data.pm10Grade.color}40` }}
        >
          <span className="text-xs font-semibold text-white/60">PM10</span>
          <span className="text-xl font-light text-white">
            {data.pm10} <span className="text-xs text-white/30">µg/m³</span>
          </span>
          <span className="text-sm font-bold" style={{ color: data.pm10Grade.color }}>
            {data.pm10Grade.label}
          </span>
        </div>
      </div>
    </div>
  );
}
