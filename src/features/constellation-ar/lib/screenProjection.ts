export function projectToCanvas(
  alt: number,
  az: number,
  deviceAz: number,
  deviceAlt: number,
  w: number,
  h: number,
  hFov = 60,
  vFov = 45,
): { x: number; y: number } | null {
  if (alt < 0) return null;
  const dAz = ((az - deviceAz + 540) % 360) - 180;
  const dAlt = alt - deviceAlt;
  if (Math.abs(dAz) > hFov / 2 || Math.abs(dAlt) > vFov / 2) return null;
  return {
    x: w / 2 + (dAz / hFov) * w,
    y: h / 2 - (dAlt / vFov) * h,
  };
}
