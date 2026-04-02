import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Menu, Star, StarOff } from "lucide-react";
import { useGeolocation } from "@/features/detect-location/model/useGeolocation";
import { useSearchLocation } from "@/features/search-location/model/useSearchLocation";
import { useFavorites } from "@/features/manage-favorites/model/useFavorites";
import { useWeather } from "@/entities/weather";
import { useAirQuality } from "@/entities/weather/api/airPollutionApi";
import { WeatherDisplay } from "@/widgets/weather-display/ui/WeatherDisplay";
import { SearchBar } from "@/widgets/search-bar/ui/SearchBar";
import { MAX_FAVORITES } from "@/shared/config";
import { getWeatherGradient } from "@/shared/lib/weatherBackground";
import { usePullToRefresh } from "@/shared/lib/usePullToRefresh";
import { useToast } from "@/shared/lib/useToast";
import { useSidebar } from "@/shared/lib/useSidebar";
import { useSelectedLocation } from "@/shared/lib/useSelectedLocation";
import { useRecentSearches } from "@/shared/lib/useRecentSearches";
import { useKeyboardShortcuts } from "@/shared/lib/useKeyboardShortcuts";

export function HomePage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { toggle: toggleSidebar } = useSidebar();
  const { selected: selectedLoc } = useSelectedLocation();
  const geo = useGeolocation();
  const search = useSearchLocation();
  const { recents, addRecent, clearRecents } = useRecentSearches();
  const { favorites, addFavorite, removeFavorite, undoDelete, isFavorite } = useFavorites();

  // Auto-open search if navigated with ?search=1
  const [searchExpanded, setSearchExpanded] = useState(false);
  useKeyboardShortcuts(() => setSearchExpanded(true));
  useEffect(() => {
    if (searchParams.get("search") === "true") {
      setSearchExpanded(true);
    }
  }, [searchParams]);

  // Priority: search selection > sidebar selection > geolocation
  const displayLat = search.selected?.lat ?? selectedLoc?.lat ?? geo.lat;
  const displayLon = search.selected?.lon ?? selectedLoc?.lon ?? geo.lon;
  const displayName =
    search.selected?.name ?? selectedLoc?.name ?? geo.name ?? undefined;

  const { data, isLoading, error } = useWeather(displayLat, displayLon, displayName);
  const { data: airData, isLoading: airLoading } = useAirQuality(displayLat, displayLon);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["weather"] });
  };

  const { containerRef, pullOffset, isRefreshing } = usePullToRefresh(handleRefresh);

  const handleAddFavorite = () => {
    if (displayLat === null || displayLon === null || !data) return;
    if (favorites.length >= MAX_FAVORITES) {
      showToast("최대 6개까지 추가할 수 있습니다");
      return;
    }
    if (isFavorite(displayLat, displayLon)) return;
    const success = addFavorite({
      name: data.current.locationName,
      lat: displayLat,
      lon: displayLon,
    });
    if (success) showToast("즐겨찾기에 추가되었습니다");
  };

  const showStarButton = data && displayLat !== null && displayLon !== null;
  const isCurrentFav = displayLat !== null && displayLon !== null && isFavorite(displayLat, displayLon);

  const handleToggleFavorite = () => {
    if (displayLat === null || displayLon === null || !data) return;

    if (isCurrentFav) {
      const fav = favorites.find((f) => f.lat === displayLat && f.lon === displayLon);
      if (fav) {
        const removed = removeFavorite(fav.id);
        if (removed) {
          showToast(`${removed.alias} 삭제됨`, {
            action: { label: "실행 취소", onClick: undoDelete },
            duration: 5000,
          });
        }
      }
    } else {
      handleAddFavorite();
    }
  };

  const bgGradient = getWeatherGradient(data?.current.icon);

  return (
    <div
      ref={containerRef}
      className="weather-bg-transition min-h-screen"
      style={{ background: bgGradient, overscrollBehavior: "contain" }}
    >
      {/* Pull-to-refresh */}
      {(pullOffset > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center transition-opacity"
          style={{ height: Math.min(pullOffset, 80) }}
        >
          <div
            className={`h-5 w-5 rounded-full border-2 border-white/30 border-t-white ${isRefreshing ? "animate-spin" : ""}`}
            style={!isRefreshing ? { transform: `rotate(${pullOffset * 3}deg)` } : undefined}
          />
        </div>
      )}

      {/* Floating top bar */}
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
            {/* Search (collapsed into icon next to hamburger) */}
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
              }}
              onClear={search.clearSearch}
              onToggle={() => setSearchExpanded(!searchExpanded)}
              recentSearches={recents}
              onClearRecents={clearRecents}
            />
          </div>

          {showStarButton && (
            <button
              onClick={handleToggleFavorite}
              className={`rounded-full p-3 backdrop-blur-md transition-colors ${
                isCurrentFav
                  ? "bg-amber-500/30 hover:bg-amber-500/40"
                  : favorites.length >= MAX_FAVORITES
                    ? "bg-black/10 opacity-50"
                    : "bg-black/20 hover:bg-black/30"
              }`}
              aria-label={isCurrentFav ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
              aria-pressed={isCurrentFav}
            >
              {isCurrentFav ? (
                <StarOff className="h-5 w-5 text-amber-300" />
              ) : (
                <Star className="h-5 w-5 text-white" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-lg px-4 pb-8">
        <WeatherDisplay
          data={data}
          isLoading={isLoading || geo.loading}
          error={error}
          locationName={displayName}
          onRetry={handleRefresh}
          airData={airData}
          airLoading={airLoading}
        />

      </div>

    </div>
  );
}
