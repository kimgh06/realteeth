import { useState, useEffect, useRef, useCallback } from 'react';
import type { PermissionState } from '../model/types';

const EMA_FACTOR = 0.15;

interface OrientationState {
  alpha: number;
  beta: number;
  gamma: number;
}

interface DragState {
  dragOffset: { az: number; alt: number };
  onMouseDown: (e: React.MouseEvent) => void;
}

interface UseDeviceOrientationReturn extends OrientationState, DragState {
  permission: PermissionState;
  requestOrientation: () => Promise<void>;
}

export function useDeviceOrientation(): UseDeviceOrientationReturn {
  const [permission, setPermission] = useState<PermissionState>('idle');
  const [orientation, setOrientation] = useState<OrientationState>({ alpha: 0, beta: 45, gamma: 0 });
  const [dragOffset, setDragOffset] = useState({ az: 0, alt: 0 });

  const smoothedRef = useRef<OrientationState>({ alpha: 0, beta: 45, gamma: 0 });
  const nullStartRef = useRef<number | null>(null);
  const listeningRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; az: number; alt: number } | null>(null);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const rawAlpha = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
      ?? e.alpha;

    if (rawAlpha === null) {
      if (nullStartRef.current === null) {
        nullStartRef.current = Date.now();
      } else if (Date.now() - nullStartRef.current > 2000) {
        setPermission('unsupported');
        window.removeEventListener('deviceorientation', handleOrientation);
      }
      return;
    }

    nullStartRef.current = null;

    const beta = e.beta ?? 45;
    const gamma = e.gamma ?? 0;

    const prev = smoothedRef.current;
    // EMA for beta and gamma (simple)
    const smoothBeta = prev.beta + EMA_FACTOR * (beta - prev.beta);
    const smoothGamma = prev.gamma + EMA_FACTOR * (gamma - prev.gamma);

    // EMA for alpha (compass) — must handle wrap-around
    let dAlpha = rawAlpha - prev.alpha;
    if (dAlpha > 180) dAlpha -= 360;
    if (dAlpha < -180) dAlpha += 360;
    const smoothAlpha = (prev.alpha + EMA_FACTOR * dAlpha + 360) % 360;

    smoothedRef.current = { alpha: smoothAlpha, beta: smoothBeta, gamma: smoothGamma };
    setOrientation({ alpha: smoothAlpha, beta: smoothBeta, gamma: smoothGamma });
  }, []);

  const requestOrientation = useCallback(async () => {
    if (listeningRef.current) return;

    const DevOrEvent = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };

    if (typeof DevOrEvent.requestPermission === 'function') {
      // iOS 13+
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
      // Android / Desktop with sensor
      setPermission('granted');
      listeningRef.current = true;
      window.addEventListener('deviceorientation', handleOrientation);
      // Schedule unsupported check after 2s if alpha stays null
      nullStartRef.current = Date.now();
    } else {
      setPermission('unsupported');
    }
  }, [handleOrientation]);

  // Desktop drag panning
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

  useEffect(() => {
    return () => {
      if (listeningRef.current) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [handleOrientation]);

  return {
    alpha: orientation.alpha,
    beta: orientation.beta,
    gamma: orientation.gamma,
    permission,
    requestOrientation,
    dragOffset,
    onMouseDown,
  };
}
