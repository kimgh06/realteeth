import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Pencil, Check, Trash2, LayoutGrid, List } from "lucide-react";
import { useWeatherSummary } from "@/entities/weather";
import { WeatherIcon } from "@/entities/weather/ui/WeatherIcon";
import { useTempUnit } from "@/shared/lib/TempUnitContext";
import { getWeatherCardGradient } from "@/shared/lib/weatherBackground";
import { useSwipeToDelete } from "@/shared/lib/useSwipeToDelete";
import { buildDetailUrl } from "@/shared/lib/routes";
import { useLongPress } from "@/shared/lib/useLongPress";
import { useToast } from "@/shared/lib/useToast";
import type { Favorite } from "@/entities/location";

type ViewMode = "grid" | "list";
const VIEW_MODE_KEY = "weather-fav-view";

function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) ?? "grid";
    } catch {
      return "grid";
    }
  });

  const setAndSave = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem(VIEW_MODE_KEY, m);
  };

  return [mode, setAndSave];
}

// ─── Shared card logic ────────────────────────────────────────

interface CardProps {
  favorite: Favorite;
  onRemove: (id: string) => void;
  onUpdateAlias: (id: string, alias: string) => void;
  onUndoDelete: () => void;
}

function useFavoriteCard({ favorite, onRemove, onUpdateAlias, onUndoDelete }: CardProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: weather } = useWeatherSummary(favorite.lat, favorite.lon, favorite.name);
  const { convert, unit } = useTempUnit();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(favorite.alias);

  const handleSaveAlias = () => {
    if (editValue.trim()) {
      onUpdateAlias(favorite.id, editValue.trim());
      showToast("별칭이 수정되었습니다");
    }
    setIsEditing(false);
  };

  const handleClick = () => {
    if (isEditing) return;
    navigate(buildDetailUrl(favorite.lat, favorite.lon, favorite.name));
  };

  const handleRemove = () => {
    onRemove(favorite.id);
    showToast(`${favorite.alias} 삭제됨`, {
      action: { label: "실행 취소", onClick: onUndoDelete },
      duration: 5000,
    });
  };

  const swipe = useSwipeToDelete(handleRemove);
  const cardBg = weather
    ? getWeatherCardGradient(weather.icon)
    : "linear-gradient(135deg, #4FC3F7, #0288D1)";

  return {
    weather, convert, unit,
    isEditing, setIsEditing,
    editValue, setEditValue,
    handleSaveAlias, handleClick, handleRemove,
    cardBg, ...swipe,
  };
}

// ─── Grid Card ───────────────────────────────────────────────

function GridCard(props: CardProps) {
  const {
    weather, convert, unit,
    isEditing, setIsEditing,
    editValue, setEditValue,
    handleSaveAlias, handleClick, handleRemove,
    cardBg, cardRef, swipeOffset, containerStyle,
  } = useFavoriteCard(props);

  const { favorite } = props;

  const longPressHandlers = useLongPress(() => {
    setIsEditing(true);
    setEditValue(favorite.alias);
  });

  return (
    <div className="relative overflow-hidden rounded-2xl" role="listitem">
      {swipeOffset < 0 && (
        <div className="absolute inset-0 flex items-center justify-end rounded-2xl bg-red-500 px-5">
          <Trash2 className="h-5 w-5 text-white" />
        </div>
      )}
      <div ref={cardRef} style={containerStyle}>
        <div
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleClick();
            if (e.key === "Delete") handleRemove();
          }}
          className={`group relative cursor-pointer shadow-md transition-transform duration-200 hover:scale-[1.02] ${isEditing ? "ring-2 ring-amber-400/60" : ""}`}
          style={{ background: cardBg }}
          role="button"
          tabIndex={0}
          aria-label={`${favorite.alias}${weather ? `. ${convert(weather.temp)}도` : ""}`}
          {...longPressHandlers}
        >
          <div className="bg-gradient-to-b from-black/10 to-black/30 p-3.5 sm:p-4">
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="rounded-full bg-black/20 p-1 text-white/50 opacity-100 backdrop-blur-sm hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={`${favorite.alias} 삭제`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mb-3 flex items-center gap-1.5 pr-8">
              {isEditing ? (
                <div className="flex w-full items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveAlias(); if (e.key === "Escape") setIsEditing(false); }}
                    className="w-full rounded border border-white/30 bg-white/20 px-1.5 py-0.5 text-sm text-white outline-none focus:border-white/50"
                    aria-label="별칭 입력"
                    autoFocus
                  />
                  <button onClick={handleSaveAlias} className="text-white/70 hover:text-white">
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="truncate text-sm font-semibold text-white">{favorite.alias}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditValue(favorite.alias); }}
                    className="shrink-0 text-white/40 opacity-100 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`${favorite.alias} 별칭 수정`}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
            {weather ? (
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl font-light text-white">{convert(weather.temp)}°{unit}</span>
                  <div className="mt-0.5 text-xs text-white/70">{convert(weather.tempMin)}°{unit} / {convert(weather.tempMax)}°{unit}</div>
                </div>
                <WeatherIcon icon={weather.icon} size="sm" />
              </div>
            ) : (
              <div className="h-12 animate-pulse rounded bg-white/10" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── List Card ───────────────────────────────────────────────

function ListCard(props: CardProps) {
  const {
    weather, convert, unit,
    isEditing, setIsEditing,
    editValue, setEditValue,
    handleSaveAlias, handleClick, handleRemove,
    cardBg, cardRef, swipeOffset, containerStyle,
  } = useFavoriteCard(props);

  const { favorite } = props;

  return (
    <div className="relative overflow-hidden rounded-xl" role="listitem">
      {swipeOffset < 0 && (
        <div className="absolute inset-0 flex items-center justify-end rounded-xl bg-red-500 px-5">
          <Trash2 className="h-5 w-5 text-white" />
        </div>
      )}
      <div ref={cardRef} style={containerStyle}>
        <div
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleClick();
            if (e.key === "Delete") handleRemove();
          }}
          className="group relative flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 shadow-sm transition-colors hover:bg-white/5"
          style={{ background: `${cardBg}` }}
          role="button"
          tabIndex={0}
          aria-label={`${favorite.alias}${weather ? `. ${convert(weather.temp)}도, ${weather.description}` : ""}`}
        >
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-black/20 to-black/30" />

          <div className="relative z-10 shrink-0">
            {weather ? (
              <WeatherIcon icon={weather.icon} size="sm" />
            ) : (
              <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
            )}
          </div>

          <div className="relative z-10 min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveAlias(); if (e.key === "Escape") setIsEditing(false); }}
                  className="w-full rounded border border-white/30 bg-white/20 px-1.5 py-0.5 text-sm text-white outline-none focus:border-white/50"
                  aria-label="별칭 입력"
                  autoFocus
                />
                <button onClick={handleSaveAlias} className="text-white/70 hover:text-white">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-white">{favorite.alias}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditValue(favorite.alias); }}
                    className="shrink-0 text-white/40 opacity-100 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`${favorite.alias} 별칭 수정`}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
                {weather && (
                  <span className="text-xs capitalize text-white/60">{weather.description}</span>
                )}
              </>
            )}
          </div>

          <div className="relative z-10 shrink-0 text-right">
            {weather ? (
              <>
                <span className="text-xl font-light text-white">{convert(weather.temp)}°{unit}</span>
                <div className="text-[11px] text-white/50">{convert(weather.tempMin)}°{unit} / {convert(weather.tempMax)}°{unit}</div>
              </>
            ) : (
              <div className="h-8 w-12 animate-pulse rounded bg-white/10" />
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            className="relative z-10 shrink-0 rounded-full p-1 text-white/30 opacity-100 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
            aria-label={`${favorite.alias} 삭제`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Container ───────────────────────────────────────────────

interface Props {
  favorites: Favorite[];
  onRemove: (id: string) => Favorite | null;
  onUpdateAlias: (id: string, alias: string) => void;
  onUndoDelete: () => void;
}

export function FavoriteList({ favorites, onRemove, onUpdateAlias, onUndoDelete }: Props) {
  const [viewMode, setViewMode] = useViewMode();

  if (favorites.length === 0) return null;

  const Card = viewMode === "grid" ? GridCard : ListCard;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">
          즐겨찾기 (
          <span className={favorites.length >= 6 ? "text-amber-400/70" : ""}>
            {favorites.length}/6
          </span>
          )
        </h3>
        <div className="flex items-center gap-1 rounded-lg bg-white/10 p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "grid" ? "bg-white/20 text-white" : "text-white/40 hover:text-white/70"}`}
            aria-label="그리드 보기"
            aria-pressed={viewMode === "grid"}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "list" ? "bg-white/20 text-white" : "text-white/40 hover:text-white/70"}`}
            aria-label="리스트 보기"
            aria-pressed={viewMode === "list"}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
            : "flex flex-col gap-2"
        }
        role="list"
      >
        {favorites.map((fav) => (
          <Card
            key={fav.id}
            favorite={fav}
            onRemove={onRemove}
            onUpdateAlias={onUpdateAlias}
            onUndoDelete={onUndoDelete}
          />
        ))}
      </div>
    </div>
  );
}
