import { useEffect, useRef, useCallback } from "react";
import { getAltAz, getSolarSystemBodies } from "../lib/celestialMath";
import { projectToCanvas } from "../lib/screenProjection";
import type { CatalogData, DeviceOrientation } from "../model/types";

interface Props {
  catalog: CatalogData;
  orientation: DeviceOrientation;
  dragOffset?: { az: number; alt: number };
  lat: number;
  lon: number;
  onCenterConstellation: (name: string | null) => void;
}

const MAG_LIMIT = 5.0;

const HIT_RADIUS = 16; // px — click/hover detection radius

export function SkyCanvas({ catalog, orientation, dragOffset, lat, lon, onCenterConstellation }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastCenterUpdateRef = useRef<number>(0);
  const orientationRef = useRef(orientation);
  orientationRef.current = orientation;
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const hFovRef = useRef(60); // horizontal FOV in degrees; vFov = hFov * 0.75
  const debugRef = useRef(true);

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

    const { azimuth, altitude } = orientationRef.current;
    const now = new Date();

    // Gnomonic projection: move camera (not stars) for drag panning.
    // Negate dragOffset so visual drag direction stays the same.
    const lookAz = azimuth - (dragOffset?.az ?? 0);
    const lookAlt = Math.max(-90, Math.min(90, altitude - (dragOffset?.alt ?? 0)));
    const hFov = hFovRef.current;
    const vFov = (2 * Math.atan(Math.tan((hFov / 2) * (Math.PI / 180)) * (h / w))) * (180 / Math.PI);

    // Precompute star screen positions (one alt/az pass, two projections)
    const starPositions: ({ x: number; y: number } | null)[] = [];
    const starPositionsUnclipped: ({ x: number; y: number } | null)[] = [];
    for (const star of catalog.stars) {
      if (star.mag > MAG_LIMIT) {
        starPositions.push(null);
        starPositionsUnclipped.push(null);
        continue;
      }
      const { alt, az } = getAltAz(star.ra, star.dec, lat, lon, now);
      starPositions.push(projectToCanvas(alt, az, lookAz, lookAlt, w, h, hFov, vFov));
      starPositionsUnclipped.push(projectToCanvas(alt, az, lookAz, lookAlt, w, h, hFov, vFov, false));
    }

    // Draw constellation lines first (behind stars)
    ctx.lineWidth = 0.8;
    for (const con of catalog.constellations) {
      for (const [a, b] of con.lines) {
        const pA = starPositionsUnclipped[a];
        const pB = starPositionsUnclipped[b];
        if (!pA || !pB) continue;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(147, 197, 253, 0.25)"; // sky-300 tint
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }
    }

    // Solar system bodies (rendered below stars layer)
    const bodies = getSolarSystemBodies(lat, lon, now);
    for (const body of bodies) {
      const pos = projectToCanvas(body.alt, body.az, lookAz, lookAlt, w, h, hFov, vFov);
      if (!pos) continue;

      // Glow
      const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, body.radius * 2.5);
      glow.addColorStop(0, body.color + 'cc');
      glow.addColorStop(1, body.color + '00');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, body.radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, body.radius, 0, Math.PI * 2);
      ctx.fillStyle = body.color;
      ctx.fill();

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(body.nameKo, pos.x, pos.y + body.radius + 13);
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

    // Hover tooltip (desktop mouse)
    if (mousePosRef.current) {
      const { x: mx, y: my } = mousePosRef.current;
      let hoveredStar: { name?: string; mag: number; hip: number; conName?: string } | null = null;
      let minDist = HIT_RADIUS;

      for (let i = 0; i < catalog.stars.length; i++) {
        const star = catalog.stars[i]!;
        if (star.mag > MAG_LIMIT) continue;
        const pos = starPositions[i];
        if (!pos) continue;
        const d = Math.hypot(pos.x - mx, pos.y - my);
        if (d < minDist) {
          minDist = d;
          // Find which constellation this star belongs to
          const con = catalog.constellations.find((c) => c.stars.includes(i));
          hoveredStar = { name: star.name, mag: star.mag, hip: star.hip, conName: con?.nameKo };
        }
      }

      if (hoveredStar) {
        const label = hoveredStar.name ?? `HIP ${hoveredStar.hip}`;
        const sub = hoveredStar.conName
          ? `${hoveredStar.conName} · 등급 ${hoveredStar.mag.toFixed(1)}`
          : `등급 ${hoveredStar.mag.toFixed(1)}`;

        const pad = 10;
        ctx.font = 'bold 13px sans-serif';
        const lw = ctx.measureText(label).width;
        ctx.font = '11px sans-serif';
        const sw = ctx.measureText(sub).width;
        const bw = Math.max(lw, sw) + pad * 2;
        const bh = 40;

        let tx = mx + 14;
        let ty = my - bh - 8;
        if (tx + bw > w) tx = mx - bw - 14;
        if (ty < 0) ty = my + 14;

        ctx.fillStyle = 'rgba(10, 20, 40, 0.85)';
        ctx.beginPath();
        ctx.roundRect(tx, ty, bw, bh, 8);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, tx + pad, ty + 16);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px sans-serif';
        ctx.fillText(sub, tx + pad, ty + 31);
      }
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

    // Debug grid: altitude/azimuth lines (toggle with D key)
    if (debugRef.current) {
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.15)';
      ctx.lineWidth = 0.5;
      ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';

      // Altitude lines (horizontal bands)
      for (let alt = -90; alt <= 90; alt += 10) {
        const pts: { x: number; y: number }[] = [];
        for (let az = 0; az < 360; az += 2) {
          const p = projectToCanvas(alt, az, lookAz, lookAlt, w, h, hFov, vFov, false);
          if (p) pts.push(p);
        }
        if (pts.length > 1) {
          ctx.beginPath();
          ctx.moveTo(pts[0]!.x, pts[0]!.y);
          for (let i = 1; i < pts.length; i++) {
            // Skip if jump is too large (wrapping)
            if (Math.abs(pts[i]!.x - pts[i - 1]!.x) < w * 1.5) {
              ctx.lineTo(pts[i]!.x, pts[i]!.y);
            } else {
              ctx.moveTo(pts[i]!.x, pts[i]!.y);
            }
          }
          ctx.stroke();
          // Label
          const mid = pts[Math.floor(pts.length / 2)];
          if (mid && mid.x > 0 && mid.x < w) {
            ctx.fillText(`${alt}°`, mid.x, mid.y - 4);
          }
        }
      }

      // Azimuth lines (vertical meridians)
      const azLabels: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
      for (let az = 0; az < 360; az += 15) {
        const pts: { x: number; y: number }[] = [];
        for (let alt = -90; alt <= 90; alt += 2) {
          const p = projectToCanvas(alt, az, lookAz, lookAlt, w, h, hFov, vFov, false);
          if (p) pts.push(p);
        }
        if (pts.length > 1) {
          ctx.beginPath();
          ctx.moveTo(pts[0]!.x, pts[0]!.y);
          for (let i = 1; i < pts.length; i++) {
            if (Math.abs(pts[i]!.y - pts[i - 1]!.y) < h * 1.5) {
              ctx.lineTo(pts[i]!.x, pts[i]!.y);
            } else {
              ctx.moveTo(pts[i]!.x, pts[i]!.y);
            }
          }
          ctx.stroke();
          const label = azLabels[az] ?? `${az}°`;
          const bot = pts[0];
          if (bot && bot.x > 10 && bot.x < w - 10) {
            ctx.fillText(label, bot.x, bot.y + 12);
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [catalog, lat, lon, onCenterConstellation, dragOffset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Wheel zoom (desktop)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.06 : 0.94;
      hFovRef.current = Math.min(90, Math.max(15, hFovRef.current * factor));
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Pinch zoom (mobile/trackpad)
    let lastPinchDist = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastPinchDist = Math.hypot(
          e.touches[0]!.clientX - e.touches[1]!.clientX,
          e.touches[0]!.clientY - e.touches[1]!.clientY,
        );
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0]!.clientX - e.touches[1]!.clientX,
          e.touches[0]!.clientY - e.touches[1]!.clientY,
        );
        if (lastPinchDist > 0) {
          hFovRef.current = Math.min(90, Math.max(15, hFovRef.current * (lastPinchDist / dist)));
        }
        lastPinchDist = dist;
      }
    };
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Debug grid toggle (D key)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') debugRef.current = !debugRef.current;
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
      onMouseMove={(e) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }}
      onMouseLeave={() => { mousePosRef.current = null; }}
    />
  );
}
