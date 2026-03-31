import { useState, useMemo, useEffect } from "react";
import { searchDistricts } from "@/entities/location";
import type { District } from "@/entities/location";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useSearchLocation() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<District | null>(null);

  const debouncedQuery = useDebounce(query, 150);
  const results = useMemo(() => searchDistricts(debouncedQuery), [debouncedQuery]);

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
