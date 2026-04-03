import * as Astronomy from 'astronomy-engine';

export function getAltAz(
  ra: number,
  dec: number,
  lat: number,
  lon: number,
  date: Date,
): { alt: number; az: number } {
  const observer = new Astronomy.Observer(lat, lon, 0);
  const time = Astronomy.MakeTime(date);
  const hor = Astronomy.Horizon(time, observer, ra, dec, 'normal');
  return { alt: hor.altitude, az: hor.azimuth };
}

export interface SolarSystemBody {
  name: string;
  nameKo: string;
  color: string;
  radius: number;
  alt: number;
  az: number;
}

const SOLAR_BODIES = [
  { body: Astronomy.Body.Moon,    nameKo: '달',   color: '#e8e8e8' },
  { body: Astronomy.Body.Venus,   nameKo: '금성', color: '#fffacd' },
  { body: Astronomy.Body.Jupiter, nameKo: '목성', color: '#ffd580' },
  { body: Astronomy.Body.Mars,    nameKo: '화성', color: '#ff6b6b' },
  { body: Astronomy.Body.Saturn,  nameKo: '토성', color: '#f5e97a' },
  { body: Astronomy.Body.Mercury, nameKo: '수성', color: '#aaaaaa' },
];

// Moon is fixed-size (apparent diameter doesn't map well to star magnitude scale)
// Planets use Astronomy.Illumination to get current apparent magnitude → radius
function magToRadius(mag: number, isMoon: boolean): number {
  if (isMoon) return 14;
  const clamped = Math.max(-4.5, mag);
  return Math.max(4, (5 - clamped) * 1.5);
}

export function getSolarSystemBodies(lat: number, lon: number, date: Date): SolarSystemBody[] {
  const observer = new Astronomy.Observer(lat, lon, 0);
  const time = Astronomy.MakeTime(date);

  return SOLAR_BODIES.map(({ body, nameKo, color }) => {
    const isMoon = body === Astronomy.Body.Moon;
    const vec = isMoon
      ? Astronomy.GeoMoon(time)
      : Astronomy.GeoVector(body, time, false);
    const eq = Astronomy.EquatorFromVector(vec);
    const hor = Astronomy.Horizon(time, observer, eq.ra, eq.dec, 'normal');
    const illum = Astronomy.Illumination(body, time);
    return {
      name: String(body),
      nameKo,
      color,
      radius: magToRadius(illum.mag, isMoon),
      alt: hor.altitude,
      az: hor.azimuth,
    };
  });
}
