import { useEffect, useRef, useCallback } from "react";
import { getAltAz } from "../lib/celestialMath";
import { projectToCanvas } from "../lib/screenProjection";
import type { CatalogData, DeviceOrientation } from "../model/types";

interface Props {
  catalog: CatalogData;
  orientation: DeviceOrientation;
  lat: number;
  lon: number;
  onCenterConstellation: (name: string | null) => void;
}

const MAG_LIMIT = 3.5;

export function SkyCanvas({ catalog, orientation, lat, lon, onCenterConstellation }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastCenterUpdateRef = useRef<number>(0);
  const orientationRef = useRef(orientation);
  orientationRef.current = orientation;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    const { alpha, beta } = orientationRef.current;
    const now = new Date();

    // Precompute star screen positions
    const starPositions: ({ x: number; y: number } | null)[] = catalog.stars.map((star) => {
      if (star.mag > MAG_LIMIT) return null;
      const { alt, az } = getAltAz(star.ra, star.dec, lat, lon, now);
      return projectToCanvas(alt, az, alpha, beta, w, h);
    });

    // Draw constellation lines first (behind stars)
    ctx.lineWidth = 0.8;
    for (const con of catalog.constellations) {
      for (const [a, b] of con.lines) {
        const pA = starPositions[a];
        const pB = starPositions[b];
        if (!pA || !pB) continue;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(147, 197, 253, 0.25)"; // sky-300 tint
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }
    }

    // Draw stars
    for (let i = 0; i < catalog.stars.length; i++) {
      const star = catalog.stars[i]!;
      if (star.mag > MAG_LIMIT) continue;
      const pos = starPositions[i];
      if (!pos) continue;

      const radius = Math.max(0.8, (4 - star.mag) * 1.5);
      const opacity = Math.max(0.3, 1 - star.mag * 0.18);

      // Glow for bright stars (mag < 1)
      if (star.mag < 1) {
        const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 3);
        glow.addColorStop(0, `rgba(200, 220, 255, ${opacity})`);
        glow.addColorStop(1, "rgba(200, 220, 255, 0)");
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.fill();
    }

    // Center constellation detection (throttled to 1/sec)
    const now2 = Date.now();
    if (now2 - lastCenterUpdateRef.current > 1000) {
      lastCenterUpdateRef.current = now2;
      let closest: string | null = null;
      let minDist = Infinity;
      const cx = w / 2;
      const cy = h / 2;

      for (const con of catalog.constellations) {
        const visible = con.stars
          .map((i) => starPositions[i])
          .filter((p): p is { x: number; y: number } => p !== null);
        if (visible.length === 0) continue;

        const avgX = visible.reduce((s, p) => s + p.x, 0) / visible.length;
        const avgY = visible.reduce((s, p) => s + p.y, 0) / visible.length;
        const dist = Math.hypot(avgX - cx, avgY - cy);

        if (dist < minDist) {
          minDist = dist;
          closest = con.nameKo;
        }
      }

      // Only show if center constellation is within half the screen diagonal
      const maxDist = Math.hypot(w / 2, h / 2) * 0.6;
      onCenterConstellation(minDist < maxDist ? closest : null);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [catalog, lat, lon, onCenterConstellation]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      const ctx = canvas.getContext("2d");
      ctx?.scale(dpr, dpr);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ width: "100%", height: "100%", touchAction: "none" }}
      aria-label="별자리 오버레이"
    />
  );
}
