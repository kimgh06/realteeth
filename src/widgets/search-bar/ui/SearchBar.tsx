import { useRef, useEffect } from "react";
import { Search, X, Clock, Trash2 } from "lucide-react";
import type { District } from "@/entities/location";

interface Props {
  query: string;
  results: District[];
  isOpen: boolean;
  isExpanded: boolean;
  onQueryChange: (value: string) => void;
  onSelect: (district: District) => void;
  onClear: () => void;
  onToggle: () => void;
  recentSearches?: District[];
  onClearRecents?: () => void;
}

export function SearchBar({
  query,
  results,
  isOpen,
  isExpanded,
  onQueryChange,
  onSelect,
  onClear,
  onToggle,
  recentSearches,
  onClearRecents,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onToggle();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isExpanded, onToggle]);

  // Collapsed: floating icon button
  if (!isExpanded) {
    return (
      <button
        onClick={onToggle}
        className="rounded-full bg-black/20 p-3 backdrop-blur-md transition-colors hover:bg-black/30"
        aria-label="장소 검색"
      >
        <Search className="h-5 w-5 text-white" />
      </button>
    );
  }

  const showRecents =
    !query.trim() &&
    recentSearches &&
    recentSearches.length > 0;

  // Expanded: full overlay
  return (
    <div className="animate-fade-in fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <div className="mx-auto max-w-lg px-4 pt-4">
        {/* Search input */}
        <div className="animate-slide-down flex items-center gap-3 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur-xl">
          <Search className="h-5 w-5 shrink-0 text-white/60" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="장소 검색 (예: 서울, 종로구, 청운동)"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            role="combobox"
            aria-expanded={isOpen && results.length > 0}
            aria-label="장소 검색"
          />
          <button
            onClick={() => {
              onClear();
              onToggle();
            }}
            className="shrink-0 text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Recent searches (shown when query is empty) */}
        {showRecents && (
          <div className="animate-slide-down mt-2 rounded-2xl border border-white/20 bg-white/10 py-2 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 pb-1.5">
              <span className="text-[11px] font-medium text-white/40">최근 검색</span>
              {onClearRecents && (
                <button
                  onClick={onClearRecents}
                  className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/50"
                >
                  <Trash2 className="h-3 w-3" />
                  전체 삭제
                </button>
              )}
            </div>
            {recentSearches!.map((d) => (
              <button
                key={d.code}
                onClick={() => onSelect(d)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-white/80 transition-colors hover:bg-white/10"
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-white/30" />
                {d.name}
              </button>
            ))}
          </div>
        )}

        {/* Search results */}
        {isOpen && results.length > 0 && (
          <ul className="animate-slide-down mt-2 max-h-80 overflow-y-auto rounded-2xl border border-white/20 bg-white/10 py-1 backdrop-blur-xl">
            {results.map((d) => (
              <li key={d.code}>
                <button
                  onClick={() => onSelect(d)}
                  className="w-full px-4 py-3 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
                >
                  {d.name}
                </button>
              </li>
            ))}
          </ul>
        )}

        {isOpen && query.trim().length > 0 && results.length === 0 && (
          <div className="animate-slide-down mt-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/60 backdrop-blur-xl">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
