import { useState, useEffect, useRef, useCallback } from 'react';
import type { PermissionState } from '../model/types';

const EMA_FACTOR = 0.15;

function detectDesktop(): boolean {
  if (!('DeviceOrientationEvent' in window)) return true;
  const DevOrEvent = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<string>;
  };
  if (typeof DevOrEvent.requestPermission === 'function') return false;
  const uaData = (navigator as Navigator & { userAgentData?: { mobile: boolean } }).userAgentData;
  if (uaData) return !uaData.mobile;
  return navigator.maxTouchPoints === 0;
}

// altitude = elevation angle from horizon (0=horizon, 90=zenith)
// Device beta: 90=upright(portrait). Tilting top toward user → beta→180 = looking up
// altitude = beta - 90
function betaToAltitude(beta: number): number {
  return Math.max(-90, Math.min(90, beta - 90));
}

interface RawSmoothed {
  azimuth: number;
  beta: number; // raw beta kept for EMA, converted to altitude on output
}

interface DragState {
  dragOffset: { az: number; alt: number };
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

interface UseDeviceOrientationReturn extends DragState {
  azimuth: number;
  altitude: number;
  permission: PermissionState;
  requestOrientation: () => Promise<void>;
}

export function useDeviceOrientation(): UseDeviceOrientationReturn {
  const [permission, setPermission] = useState<PermissionState>(
    () => detectDesktop() ? 'unsupported' : 'idle'
  );
  const [azimuth, setAzimuth] = useState(0);
  const [altitude, setAltitude] = useState(25); // default: slightly above horizon
  const [dragOffset, setDragOffset] = useState({ az: 0, alt: 0 });

  const smoothedRef = useRef<RawSmoothed>({ azimuth: 0, beta: 65 });
  const nullStartRef = useRef<number | null>(null);
  const listeningRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; az: number; alt: number } | null>(null);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const webkitHeading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
    // webkitCompassHeading (iOS): 0=N, clockwise ✓
    // deviceorientationabsolute.alpha (Android): 0=N, counter-clockwise → invert to get compass heading
    const rawAzimuth = webkitHeading != null
      ? webkitHeading
      : (360 - (e.alpha ?? 0)) % 360;

    if (e.alpha === null && webkitHeading == null) {
      if (nullStartRef.current === null) {
        nullStartRef.current = Date.now();
      } else if (Date.now() - nullStartRef.current > 2000) {
        setPermission('unsupported');
        window.removeEventListener('deviceorientation', handleOrientation);
      }
      return;
    }

    nullStartRef.current = null;

    const beta = e.beta ?? 65;
    const prev = smoothedRef.current;

    // EMA for beta
    const smoothBeta = prev.beta + EMA_FACTOR * (beta - prev.beta);

    // EMA for azimuth — must handle wrap-around
    let dAz = rawAzimuth - prev.azimuth;
    if (dAz > 180) dAz -= 360;
    if (dAz < -180) dAz += 360;
    const smoothAzimuth = (prev.azimuth + EMA_FACTOR * dAz + 360) % 360;

    smoothedRef.current = { azimuth: smoothAzimuth, beta: smoothBeta };
    setAzimuth(smoothAzimuth);
    setAltitude(betaToAltitude(smoothBeta));
  }, []);

  const requestOrientation = useCallback(async () => {
    if (listeningRef.current) return;

    if (!('DeviceOrientationEvent' in window)) {
      setPermission('unsupported');
      return;
    }

    const DevOrEvent = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };

    if (typeof DevOrEvent.requestPermission === 'function') {
      // iOS 13+
      if (!window.isSecureContext) {
        setPermission('unsupported');
        return;
      }
      setPermission('requesting');
      try {
        const result = await DevOrEvent.requestPermission();
        if (result === 'granted') {
          setPermission('granted');
          listeningRef.current = true;
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          setPermission('denied');
        }
      } catch {
        setPermission('denied');
      }
    } else if ('DeviceOrientationEvent' in window) {
      // Android Chrome: prefer deviceorientationabsolute (absolute north-referenced heading)
      setPermission('granted');
      listeningRef.current = true;
      const supportsAbsolute = typeof (window as unknown as Record<string, unknown>)['ondeviceorientationabsolute'] !== 'undefined';
      if (supportsAbsolute) {
        window.addEventListener('deviceorientationabsolute' as 'deviceorientation', handleOrientation);
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
      nullStartRef.current = Date.now();
    } else {
      setPermission('unsupported');
    }
  }, [handleOrientation]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      az: dragOffset.az,
      alt: dragOffset.alt,
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = ev.clientX - dragStartRef.current.x;
      const dy = ev.clientY - dragStartRef.current.y;
      setDragOffset({
        az: dragStartRef.current.az + dx * 0.2,
        alt: dragStartRef.current.alt - dy * 0.2,
      });
    };

    const onMouseUp = () => {
      dragStartRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [dragOffset]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      az: dragOffset.az,
      alt: dragOffset.alt,
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (!dragStartRef.current) return;
      const t = ev.touches[0];
      if (!t) return;
      const dx = t.clientX - dragStartRef.current.x;
      const dy = t.clientY - dragStartRef.current.y;
      setDragOffset({
        az: dragStartRef.current.az + dx * 0.2,
        alt: dragStartRef.current.alt - dy * 0.2,
      });
    };

    const onTouchEnd = () => {
      dragStartRef.current = null;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
  }, [dragOffset]);

  useEffect(() => {
    return () => {
      if (listeningRef.current) {
        window.removeEventListener('deviceorientationabsolute' as 'deviceorientation', handleOrientation);
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [handleOrientation]);

  return {
    azimuth,
    altitude,
    permission,
    requestOrientation,
    dragOffset,
    onMouseDown,
    onTouchStart,
  };
}
