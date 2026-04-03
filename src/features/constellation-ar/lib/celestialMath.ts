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
