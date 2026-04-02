import { useNavigate } from "react-router-dom";
import { Menu, ArrowLeft, Plus } from "lucide-react";
import { useFavorites } from "@/features/manage-favorites/model/useFavorites";
import { FavoriteList } from "@/widgets/favorite-list/ui/FavoriteList";
import { MAX_FAVORITES } from "@/shared/config";
import { useToast } from "@/shared/lib/useToast";
import { useSidebar } from "@/shared/lib/useSidebar";

export function FavoritesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { toggle: toggleSidebar } = useSidebar();
  const { favorites, removeFavorite, undoDelete, updateAlias } = useFavorites();

  return (
    <div className="min-h-screen" style={{ background: "#0d1b2a" }}>
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#0d1b2a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSidebar}
              className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/15"
              aria-label="메뉴 열기"
              aria-controls="sidebar"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={() => navigate(-1)}
              className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/15"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-lg font-semibold text-white">즐겨찾기</h1>
          </div>
          <button
            onClick={() => {
              if (favorites.length >= MAX_FAVORITES) {
                showToast("최대 6개까지 추가할 수 있습니다");
              } else {
                navigate("/?search=true");
              }
            }}
            className={`rounded-full p-2 transition-colors ${
              favorites.length >= MAX_FAVORITES
                ? "bg-white/5 opacity-50"
                : "bg-white/10 hover:bg-white/15"
            }`}
            aria-label="장소 검색하여 추가"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-5">
        {favorites.length === 0 ? (
          <div className="pt-20 text-center">
            <p className="text-base text-white/50">즐겨찾기가 없습니다</p>
            <p className="mt-2 text-sm text-white/30">
              홈 화면에서 장소를 검색하여 추가하세요
            </p>
            <button
              onClick={() => navigate("/?search=true")}
              className="mt-6 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/15"
            >
              장소 검색하기
            </button>
          </div>
        ) : (
          <FavoriteList
            favorites={favorites}
            onRemove={removeFavorite}
            onUpdateAlias={updateAlias}
            onUndoDelete={undoDelete}
          />
        )}
      </div>
    </div>
  );
}
