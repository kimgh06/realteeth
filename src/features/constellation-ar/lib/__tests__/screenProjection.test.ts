import { describe, it, expect } from 'vitest';
import { projectToCanvas } from '../screenProjection';

const W = 800;
const H = 600;

describe('projectToCanvas', () => {
  it('star at exact device heading/alt maps near canvas center', () => {
    const result = projectToCanvas(45, 90, 90, 45, W, H);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(W / 2, 0);
    expect(result!.y).toBeCloseTo(H / 2, 0);
  });

  it('star below horizon (alt < 0) returns null', () => {
    const result = projectToCanvas(-5, 90, 90, 45, W, H);
    expect(result).toBeNull();
  });

  it('star outside horizontal FOV returns null', () => {
    // default hFov=60, device at az=90, star at az=180 → dAz=90 > 30
    const result = projectToCanvas(45, 180, 90, 45, W, H);
    expect(result).toBeNull();
  });

  it('star outside vertical FOV returns null', () => {
    // default vFov=45, device at alt=45, star at alt=0 → dAlt=-45 which is exactly at boundary
    // use alt=0 with deviceAlt=45 → dAlt=-45 → |dAlt| > 22.5
    const result = projectToCanvas(0, 90, 90, 45, W, H);
    expect(result).toBeNull();
  });

  it('star to the right of center maps to x > W/2', () => {
    // device at az=90, star at az=100 → dAz=+10, positive → x > W/2
    const result = projectToCanvas(45, 100, 90, 45, W, H);
    expect(result).not.toBeNull();
    expect(result!.x).toBeGreaterThan(W / 2);
  });

  it('star above center maps to y < H/2', () => {
    // device at alt=30, star at alt=40 → dAlt=+10 → y < H/2
    const result = projectToCanvas(40, 90, 90, 30, W, H);
    expect(result).not.toBeNull();
    expect(result!.y).toBeLessThan(H / 2);
  });

  it('handles azimuth wrap-around correctly', () => {
    // device at az=10, star at az=350 → dAz should be -20, not +340
    const result = projectToCanvas(45, 350, 10, 45, W, H);
    expect(result).not.toBeNull();
    // dAz = -20 → x < W/2
    expect(result!.x).toBeLessThan(W / 2);
  });

  it('respects custom FOV parameters', () => {
    // With hFov=10, gnomonic clip is pixel-based (±10% screen).
    // A star 15° off-axis maps far outside the clip window → null.
    const result = projectToCanvas(45, 105, 90, 45, W, H, 10, 10);
    expect(result).toBeNull();
  });
});
