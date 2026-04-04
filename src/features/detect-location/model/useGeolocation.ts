import { useState, useEffect } from "react";
import { findNearestDistrict } from "@/entities/location";

interface GeoState {
  lat: number | null;
  lon: number | null;
  name: string | null;
  error: string | null;
  loading: boolean;
}

const DEFAULT_LAT = 37.5665;
const DEFAULT_LON = 126.978;
const DEFAULT_NAME = "서울특별시";

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    lat: DEFAULT_LAT,
    lon: DEFAULT_LON,
    name: DEFAULT_NAME,
    error: null,
    loading: false,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const nearest = findNearestDistrict(lat, lon);
        setState({
          lat,
          lon,
          name: nearest?.name ?? null,
          error: null,
          loading: false,
        });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000 },
    );
  }, []);

  return state;
}
