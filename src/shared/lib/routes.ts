export function buildDetailUrl(lat: number, lon: number, name: string): string {
  return `/detail?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`;
}
