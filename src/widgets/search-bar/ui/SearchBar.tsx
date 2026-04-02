import { useRef, useEffect, useState } from "react";
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
  const listRef = useRef<HTMLUListElement>(null);
  const [localQuery, setLocalQuery] = useState<string>(query);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  useEffect(() => {
    if (activeIndex >= 0) {
      const el = document.getElementById(`result-${activeIndex}`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const onInputChange = (val: string) => {
    setLocalQuery(val);
    onQueryChange(val);
  };

  // Keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        onSelect(results[activeIndex]!);
      }
    } else if (e.key === "Escape") {
      onToggle();
    }
  };

  // Highlight matched text for better visibility
  const highlight = (text: string) => {
    if (!localQuery) return text;
    const q = localQuery.toLowerCase();
    const t = text.toLowerCase();
    const idx = t.indexOf(q);
    if (idx < 0) return text;
    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + localQuery.length);
    const after = text.substring(idx + localQuery.length);
    return (
      <span>
        {before}
        <mark style={{ background: "yellow" }}>{match}</mark>
        {after}
      </span>
    );
  };

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
            value={localQuery}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="도시 검색 (예: 서울, 종로구 또는 Tokyo, New York)"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            role="combobox"
            aria-expanded={isOpen && results.length > 0}
            aria-label="장소 검색"
            aria-controls="search-results"
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
            {recentSearches!.map((d, idx) => (
              <button
                key={d.code ?? `recent-${idx}`}
                onClick={() => onSelect(d)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-white/80 transition-colors hover:bg-white/10"
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-white/30" />
                {highlight(d.name)}
              </button>
            ))}
          </div>
        )}

        {/* Screen reader announcement */}
        {isOpen && (
          <div role="status" aria-live="polite" className="sr-only">
            {results.length > 0
              ? `${results.length}개의 검색 결과`
              : query.trim().length > 0
              ? "검색 결과가 없습니다"
              : ""}
          </div>
        )}

        {/* Search results */}
        {isOpen && results.length > 0 && (
          <ul id="search-results" ref={listRef} role="listbox" className="animate-slide-down mt-2 max-h-80 overflow-y-auto rounded-2xl border border-white/20 bg-white/10 py-1 backdrop-blur-xl scroll-smooth">
            {results.map((d, idx) => (
              <li key={d.code}>
                <button
                  id={`result-${idx}`}
                  role="option"
                  aria-selected={activeIndex === idx}
                  onClick={() => onSelect(d)}
                  className={`w-full px-4 py-3 text-left text-sm text-white/90 transition-colors hover:bg-white/10 ${activeIndex === idx ? 'bg-white/20' : ''}`}
                >
                  {highlight(d.name)}
                </button>
              </li>
            ))}
          </ul>
        )}

        {isOpen && query.trim().length > 0 && results.length === 0 && (
          <div className="animate-slide-down mt-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/60 backdrop-blur-xl">
            <p>검색 결과가 없습니다.</p>
            <p className="mt-1 text-xs text-white/40">다른 검색어를 시도해 보세요.</p>
          </div>
        )}

        {isOpen && results.length > 0 && (
          <div className="mt-2 px-1 text-center">
            <span className="text-[10px] text-white/30">
              ↑↓ 키로 이동, Enter로 선택, Esc로 닫기
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
