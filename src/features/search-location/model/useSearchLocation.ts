import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchDistricts } from "@/entities/location";
import { geocodeQuery } from "@/entities/location/api/geocodingApi";
import type { District } from "@/entities/location";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const isKorean = (q: string) => /[\uAC00-\uD7A3]/.test(q);

export function useSearchLocation() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<District | null>(null);

  const debouncedQuery = useDebounce(query, 200);

  const localResults = useMemo(() => {
    if (!debouncedQuery.trim() || !isKorean(debouncedQuery)) return [];
    return searchDistricts(debouncedQuery);
  }, [debouncedQuery]);

  const enableRemote = debouncedQuery.trim().length >= 2 && !isKorean(debouncedQuery);
  const { data: remoteResults = [] } = useQuery({
    queryKey: ["geocode", debouncedQuery],
    queryFn: () => geocodeQuery(debouncedQuery),
    enabled: enableRemote,
    staleTime: 60_000,
  });

  const results = isKorean(debouncedQuery) ? localResults : remoteResults;

  const handleSelect = (district: District) => {
    setSelected(district);
    setQuery(district.name);
    setIsOpen(false);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelected(null);
    setIsOpen(value.trim().length > 0);
  };

  const clearSearch = () => {
    setQuery("");
    setSelected(null);
    setIsOpen(false);
  };

  return {
    query,
    results,
    isOpen,
    selected,
    handleSelect,
    handleQueryChange,
    clearSearch,
  };
}
