import { Wind } from "lucide-react";
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
        대기질 · 미세먼지
      </h3>
      <div className="flex items-center gap-4">
        {/* AQI indicator */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: data.color + "30", borderColor: data.color, borderWidth: 2 }}
          >
            <Wind className="h-6 w-6" style={{ color: data.color }} />
          </div>
          <span
            className="text-xs font-semibold"
            style={{ color: data.color }}
          >
            {data.label}
          </span>
        </div>

        {/* PM values */}
        <div className="flex flex-1 gap-3">
          <div className="flex-1 rounded-xl bg-white/8 px-3 py-2.5 text-center">
            <div className="text-lg font-light text-white">{data.pm2_5}</div>
            <div className="text-[11px] text-white/50">PM2.5 µg/m³</div>
          </div>
          <div className="flex-1 rounded-xl bg-white/8 px-3 py-2.5 text-center">
            <div className="text-lg font-light text-white">{data.pm10}</div>
            <div className="text-[11px] text-white/50">PM10 µg/m³</div>
          </div>
        </div>
      </div>
    </div>
  );
}
