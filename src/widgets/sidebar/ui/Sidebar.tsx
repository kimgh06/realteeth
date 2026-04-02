import { useNavigate, useLocation } from "react-router-dom";
import { CloudSun, MapPin, Search, ChevronRight } from "lucide-react";
import { useSidebar } from "@/shared/lib/useSidebar";
import { buildDetailUrl } from "@/shared/lib/routes";
import { useSelectedLocation } from "@/shared/lib/useSelectedLocation";
import { useFavorites } from "@/features/manage-favorites/model/useFavorites";
import { SidebarFavoriteRow } from "./SidebarFavoriteRow";

export function Sidebar() {
  const { isOpen, close } = useSidebar();
  const { selected, clearSelection } = useSelectedLocation();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectLocation = (fav: { lat: number; lon: number; name: string }) => {
    close();
    navigate(buildDetailUrl(fav.lat, fav.lon, fav.name));
  };

  const handleCurrentLocation = () => {
    clearSelection();
    if (location.pathname !== "/") {
      navigate("/");
    }
    close();
  };

  const handleSearch = () => {
    close();
    navigate("/?search=true");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[45] bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        id="sidebar"
        className={`fixed top-0 bottom-0 left-0 z-[46] w-[280px] border-r border-white/10 bg-[#0d1b2a]/95 backdrop-blur-xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="navigation"
        aria-label="사이드바 메뉴"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
            <CloudSun className="h-5 w-5 text-sky-400" />
            <span className="text-base font-bold text-white">날씨</span>
          </div>

          {/* Search */}
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={handleSearch}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
            >
              <Search className="h-4 w-4" />
              <span className="text-[13px]">장소 검색</span>
            </button>
          </div>

          {/* Current location */}
          <div className="px-3 pb-1">
            <button
              onClick={handleCurrentLocation}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 transition-colors ${
                selected === null
                  ? "bg-sky-500/15"
                  : "hover:bg-white/5"
              }`}
              aria-current={selected === null ? "true" : undefined}
            >
              <MapPin className="h-4 w-4 shrink-0 text-sky-400" />
              <span className="text-[13px] font-medium text-white/90">현재 위치</span>
            </button>
          </div>

          {/* Favorites */}
          {favorites.length > 0 && (
            <div className="flex-1 overflow-y-auto px-3 pt-3 pb-2">
              <div className="mb-1.5 flex items-center justify-between px-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                  즐겨찾기
                </span>
                <button
                  onClick={() => { close(); navigate("/favorites"); }}
                  className="flex items-center gap-0.5 text-[11px] text-white/30 hover:text-white/50"
                >
                  관리
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-0.5">
                {favorites.map((fav) => (
                  <SidebarFavoriteRow
                    key={fav.id}
                    favorite={fav}
                    isActive={
                      selected?.lat === fav.lat && selected?.lon === fav.lon
                    }
                    onSelect={() =>
                      handleSelectLocation({
                        lat: fav.lat,
                        lon: fav.lon,
                        name: fav.name,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {favorites.length === 0 && (
            <div className="flex-1 px-6 pt-8 text-center">
              <p className="text-xs text-white/25">즐겨찾기가 없습니다</p>
              <p className="mt-1 text-[11px] text-white/15">검색으로 장소를 추가하세요</p>
            </div>
          )}

        </div>
      </aside>
    </>
  );
}
