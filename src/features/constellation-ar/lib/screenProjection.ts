const DEG = Math.PI / 180;

/**
 * Gnomonic (tangent-plane) projection.
 * Projects a sky point (alt/az) onto a flat screen centered on the device
 * look direction (deviceAz/deviceAlt). Preserves straight lines and
 * constellation shapes at all altitudes, unlike the naive equirectangular
 * approach which distorts near the zenith.
 */
export function projectToCanvas(
  alt: number,
  az: number,
  deviceAz: number,
  deviceAlt: number,
  w: number,
  h: number,
  hFov = 60,
  vFov = 45,
  clip = true,
): { x: number; y: number } | null {
  const a0 = deviceAz * DEG;
  const e0 = deviceAlt * DEG;
  const a = az * DEG;
  const e = alt * DEG;

  const sinE0 = Math.sin(e0);
  const cosE0 = Math.cos(e0);
  const sinE = Math.sin(e);
  const cosE = Math.cos(e);
  const dA = a - a0;
  const cosDa = Math.cos(dA);

  // Cosine of angular distance from center of view
  const cosc = sinE0 * sinE + cosE0 * cosE * cosDa;
  const minCosc = clip ? 0.01 : 0.001;
  if (cosc <= minCosc) return null;

  // Gnomonic projection onto tangent plane
  const px = (cosE * Math.sin(dA)) / cosc;
  const py = (cosE0 * sinE - sinE0 * cosE * cosDa) / cosc;

  // Convert tangent-plane coords to pixels using FOV
  const scaleX = w / (2 * Math.tan((hFov / 2) * DEG));
  const scaleY = h / (2 * Math.tan((vFov / 2) * DEG));

  const sx = w / 2 + px * scaleX;
  const sy = h / 2 - py * scaleY;

  if (clip) {
    if (sx < -w * 0.1 || sx > w * 1.1 || sy < -h * 0.1 || sy > h * 1.1) return null;
  }

  return { x: sx, y: sy };
}
