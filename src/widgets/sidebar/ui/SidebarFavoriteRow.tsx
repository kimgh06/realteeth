import { useWeatherSummary } from "@/entities/weather";
import { WeatherIcon } from "@/entities/weather/ui/WeatherIcon";
import type { Favorite } from "@/entities/location";

interface Props {
  favorite: Favorite;
  isActive: boolean;
  onSelect: () => void;
}

export function SidebarFavoriteRow({ favorite, isActive, onSelect }: Props) {
  const { data: weather } = useWeatherSummary(
    favorite.lat,
    favorite.lon,
    favorite.name,
  );

  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
        isActive
          ? "bg-white/10"
          : "hover:bg-white/5"
      }`}
      aria-current={isActive ? "true" : undefined}
    >
      {/* Compact weather icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {weather ? (
          <WeatherIcon icon={weather.icon} size="sm" />
        ) : (
          <div className="h-6 w-6 animate-pulse rounded-full bg-white/10" />
        )}
      </div>

      {/* Name + description */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-white/90">
          {favorite.alias}
        </div>
        {weather && (
          <div className="text-[11px] capitalize text-white/40">
            {weather.description}
          </div>
        )}
      </div>

      {/* Temperature */}
      <span className="shrink-0 text-sm font-medium tabular-nums text-white/80">
        {weather ? `${weather.temp}°` : "—"}
      </span>
    </button>
  );
}
