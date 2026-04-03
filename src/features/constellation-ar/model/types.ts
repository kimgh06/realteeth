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

export interface DeviceOrientation {
  azimuth: number;  // compass heading 0-360, clockwise from North
  altitude: number; // elevation -90..90 (0=horizon, 90=zenith)
}

export type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';
