export interface CatalogStar {
  hip: number;
  ra: number;       // Right Ascension in decimal hours (0-24)
  dec: number;      // Declination in degrees (-90 to +90)
  mag: number;      // Apparent magnitude (lower = brighter)
  name?: string;    // Common name
}

export interface Constellation {
  id: string;                    // IAU abbreviation e.g. "Ori"
  nameKo: string;                // Korean name e.g. "오리온자리"
  stars: number[];               // indices into CatalogStar[]
  lines: [number, number][];     // star index pairs for stick figure
}

export interface CatalogData {
  stars: CatalogStar[];
  constellations: Constellation[];
}

export interface VisibleStar {
  x: number;
  y: number;
  mag: number;
  name?: string;
}

export interface VisibleConstellation {
  id: string;
  nameKo: string;
  lines: [{ x1: number; y1: number; x2: number; y2: number }];
  centerX: number;
  centerY: number;
}

export interface DeviceOrientation {
  alpha: number;  // compass heading 0-360
  beta: number;   // tilt up/down
  gamma: number;  // tilt left/right
}

export type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';
