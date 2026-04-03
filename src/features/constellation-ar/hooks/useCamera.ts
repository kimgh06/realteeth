import { useState, useEffect, useRef } from 'react';
import type { PermissionState } from '../model/types';

export function useCamera() {
  const [permission, setPermission] = useState<PermissionState>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestCamera = async () => {
    if (!window.isSecureContext) {
      setPermission('unsupported');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission('unsupported');
      return;
    }
    setPermission('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermission('granted');
    } catch (err) {
      if (err instanceof Error && err.name === 'NotFoundError') {
        setPermission('unsupported');
      } else {
        setPermission('denied');
      }
    }
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, permission, requestCamera };
}
