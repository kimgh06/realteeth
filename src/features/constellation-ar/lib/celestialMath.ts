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
  { body: Astronomy.Body.Sun,     nameKo: '태양',   color: '#FFD700', fixedRadius: 16 },
  { body: Astronomy.Body.Moon,    nameKo: '달',     color: '#e8e8e8', fixedRadius: 16 },
  { body: Astronomy.Body.Venus,   nameKo: '금성',   color: '#fffacd', fixedRadius: 12 },
  { body: Astronomy.Body.Jupiter, nameKo: '목성',   color: '#ffd580', fixedRadius: 12 },
  { body: Astronomy.Body.Saturn,  nameKo: '토성',   color: '#f5e97a', fixedRadius: 10 },
  { body: Astronomy.Body.Mars,    nameKo: '화성',   color: '#ff6b6b', fixedRadius: 8 },
  { body: Astronomy.Body.Mercury, nameKo: '수성',   color: '#aaaaaa', fixedRadius: 6 },
  { body: Astronomy.Body.Uranus,  nameKo: '천왕성', color: '#87ceeb', fixedRadius: 6 },
  { body: Astronomy.Body.Neptune, nameKo: '해왕성', color: '#4169e1', fixedRadius: 6 },
  { body: Astronomy.Body.Pluto,   nameKo: '명왕성', color: '#d2b48c', fixedRadius: 4 },
];

export function getSolarSystemBodies(lat: number, lon: number, date: Date): SolarSystemBody[] {
  const observer = new Astronomy.Observer(lat, lon, 0);
  const time = Astronomy.MakeTime(date);

  return SOLAR_BODIES.map(({ body, nameKo, color, fixedRadius }) => {
    const vec = Astronomy.GeoVector(body, time, false);
    const eq = Astronomy.EquatorFromVector(vec);
    const hor = Astronomy.Horizon(time, observer, eq.ra, eq.dec, 'normal');
    return {
      name: String(body),
      nameKo,
      color,
      radius: fixedRadius,
      alt: hor.altitude,
      az: hor.azimuth,
    };
  });
}
