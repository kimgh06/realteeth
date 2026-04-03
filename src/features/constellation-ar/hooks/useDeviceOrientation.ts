import { useState, useEffect, useRef, useCallback } from 'react';
import type { PermissionState } from '../model/types';

const EMA_FACTOR = 0.15;
const DEG = Math.PI / 180;

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

// Tilt-compensated azimuth from W3C ZXY Euler angles.
// Projects the camera's forward direction (-Z device axis) onto the horizontal plane.
// This is correct at all tilt angles including upright (beta=90) and near-flat (beta≈0).
// iOS: skipped — webkitCompassHeading already provides tilt compensation at OS level.
//
// Derivation: camera_earth = M^T · [0,0,-1], where M = Ry(γ)·Rx(β)·Rz(α) (W3C ZXY)
//   East  = cα·sγ + sα·sβ·cγ
//   North = -sα·sγ + cα·sβ·cγ
// Android alpha is CCW → negate the result to get CW compass heading.
function computeAzimuth(alpha: number, beta: number, gamma: number): number {
  const a = alpha * DEG, b = beta * DEG, g = gamma * DEG;
  const sa = Math.sin(a), ca = Math.cos(a);
  const sb = Math.sin(b);
  const sg = Math.sin(g), cg = Math.cos(g);

  const east  =  ca * sg + sa * sb * cg;
  const north = -sa * sg + ca * sb * cg;
  // Negate atan2 result: Android alpha is CCW, compass is CW
  return ((-(Math.atan2(east, north) / DEG)) + 360) % 360;
}

// altitude = elevation angle from horizon (0=horizon, 90=zenith)
// Device beta: 90=upright(portrait). Tilting top toward user → beta→180 = looking up
function betaToAltitude(beta: number): number {
  return Math.max(-90, Math.min(90, beta - 90));
}

interface RawSmoothed {
  azimuth: number;
  beta: number;
  gamma: number;
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
  const [altitude, setAltitude] = useState(25);
  const [dragOffset, setDragOffset] = useState({ az: 0, alt: 0 });

  const smoothedRef = useRef<RawSmoothed>({ azimuth: 0, beta: 65, gamma: 0 });
  const nullStartRef = useRef<number | null>(null);
  const listeningRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; az: number; alt: number } | null>(null);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const webkitHeading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;

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

    const rawAlpha = e.alpha ?? 0;
    const rawBeta = e.beta ?? 65;
    const rawGamma = e.gamma ?? 0;

    // iOS: use webkitCompassHeading (tilt-compensated at OS level)
    // Android: compute tilt-compensated azimuth from all three axes to avoid gimbal lock
    const rawAzimuth = webkitHeading != null
      ? webkitHeading
      : computeAzimuth(rawAlpha, rawBeta, rawGamma);

    const prev = smoothedRef.current;

    // EMA for beta and gamma
    const smoothBeta = prev.beta + EMA_FACTOR * (rawBeta - prev.beta);
    const smoothGamma = prev.gamma + EMA_FACTOR * (rawGamma - prev.gamma);

    // EMA for azimuth — wrap-around safe
    let dAz = rawAzimuth - prev.azimuth;
    if (dAz > 180) dAz -= 360;
    if (dAz < -180) dAz += 360;
    const smoothAzimuth = (prev.azimuth + EMA_FACTOR * dAz + 360) % 360;

    smoothedRef.current = { azimuth: smoothAzimuth, beta: smoothBeta, gamma: smoothGamma };
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
      // Android Chrome: prefer deviceorientationabsolute for absolute north-referenced heading
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
