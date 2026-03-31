import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Menu, Star, StarOff } from "lucide-react";
import { useWeather } from "@/entities/weather";
import { useAirQuality } from "@/entities/weather/api/airPollutionApi";
import { useFavorites } from "@/features/manage-favorites/model/useFavorites";
import { useSearchLocation } from "@/features/search-location/model/useSearchLocation";
import { WeatherDisplay } from "@/widgets/weather-display/ui/WeatherDisplay";
import { SearchBar } from "@/widgets/search-bar/ui/SearchBar";
import { MAX_FAVORITES } from "@/shared/config";
import { getWeatherGradient } from "@/shared/lib/weatherBackground";
import { buildDetailUrl } from "@/shared/lib/routes";
import { useToast } from "@/shared/lib/useToast";
import { useSidebar } from "@/shared/lib/useSidebar";
import { useRecentSearches } from "@/shared/lib/useRecentSearches";

export function DetailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { toggle: toggleSidebar } = useSidebar();
  const { favorites, addFavorite, removeFavorite, undoDelete, isFavorite } = useFavorites();
  const search = useSearchLocation();
  const { recents, addRecent, clearRecents } = useRecentSearches();
  const [searchExpanded, setSearchExpanded] = useState(false);

  const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : null;
  const lon = searchParams.get("lon") ? Number(searchParams.get("lon")) : null;
  const name = searchParams.get("name") ?? undefined;

  const { data, isLoading, error } = useWeather(lat, lon, name);
  const { data: airData, isLoading: airLoading } = useAirQuality(lat, lon);

  const isFav = lat !== null && lon !== null && isFavorite(lat, lon);
  const favEntry = favorites.find((f) => f.lat === lat && f.lon === lon);

  const handleToggleFavorite = () => {
    if (lat === null || lon === null || !data) return;
    if (isFav && favEntry) {
      const removed = removeFavorite(favEntry.id);
      if (removed) {
        showToast(`${removed.alias} 삭제됨`, {
          action: { label: "실행 취소", onClick: undoDelete },
          duration: 5000,
        });
      }
    } else if (favorites.length >= MAX_FAVORITES) {
      showToast("최대 6개까지 추가할 수 있습니다");
    } else {
      const success = addFavorite({ name: data.current.locationName, lat, lon });
      if (success) showToast("즐겨찾기에 추가되었습니다");
    }
  };

  const bgGradient = getWeatherGradient(data?.current.icon);

  return (
    <div className="weather-bg-transition min-h-screen" style={{ background: bgGradient }}>
      <div className="fixed top-0 right-0 left-0 z-40">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSidebar}
              className="rounded-full bg-black/20 p-3 backdrop-blur-md transition-colors hover:bg-black/30"
              aria-label="메뉴 열기"
              aria-controls="sidebar"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={() => navigate(-1)}
              className="rounded-full bg-black/20 p-3 backdrop-blur-md transition-colors hover:bg-black/30"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <SearchBar
              query={search.query}
              results={search.results}
              isOpen={search.isOpen}
              isExpanded={searchExpanded}
              onQueryChange={search.handleQueryChange}
              onSelect={(d) => {
                search.handleSelect(d);
                addRecent(d);
                setSearchExpanded(false);
                navigate(buildDetailUrl(d.lat, d.lon, d.name));
              }}
              onClear={search.clearSearch}
              onToggle={() => setSearchExpanded(!searchExpanded)}
              recentSearches={recents}
              onClearRecents={clearRecents}
            />
          </div>

          {data && lat && lon && (
            <button
              onClick={handleToggleFavorite}
              className={`rounded-full p-3 backdrop-blur-md transition-colors ${
                isFav
                  ? "bg-amber-500/30 hover:bg-amber-500/40"
                  : favorites.length >= MAX_FAVORITES
                    ? "bg-black/10 opacity-50"
                    : "bg-black/20 hover:bg-black/30"
              }`}
              aria-label={isFav ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
              aria-pressed={isFav}
            >
              {isFav ? (
                <StarOff className="h-5 w-5 text-amber-300" />
              ) : (
                <Star className="h-5 w-5 text-white/70" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-8">
        <WeatherDisplay
          data={data}
          isLoading={isLoading}
          error={error}
          locationName={name}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["weather", lat, lon] })}
          airData={airData}
          airLoading={airLoading}
        />
      </div>
    </div>
  );
}
