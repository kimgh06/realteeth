import { useState, useEffect } from "react";
import { findNearestDistrict } from "@/entities/location";

interface GeoState {
  lat: number | null;
  lon: number | null;
  name: string | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    lat: null,
    lon: null,
    name: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        lat: 37.5665,
        lon: 126.978,
        name: "서울특별시",
        error: null,
        loading: false,
      });
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
      () => {
        setState({
          lat: 37.5665,
          lon: 126.978,
          name: "서울특별시",
          error: null,
          loading: false,
        });
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  return state;
}
