export const DEG = Math.PI / 180;

export const LEBANON = { name: "Lebanon", lon: 35.8623, lat: 33.8547 };
export const BEIRUT = { name: "Beirut", lon: 35.5018, lat: 33.8938 };

export interface Route {
  name: string;
  lon: number;
  lat: number;
  color: string;
}

export const ROUTES: Route[] = [
  { name: "Istanbul", lon: 28.9784, lat: 41.0082, color: "#64f4ff" },
  { name: "Cairo", lon: 31.2357, lat: 30.0444, color: "#ffd166" },
  { name: "Dubai", lon: 55.2708, lat: 25.2048, color: "#6dffac" },
  { name: "Riyadh", lon: 46.6753, lat: 24.7136, color: "#64f4ff" },
  { name: "Amman", lon: 35.9304, lat: 31.9539, color: "#ffd166" },
  { name: "Larnaca", lon: 33.6233, lat: 34.9182, color: "#6dffac" },
];

export interface GlobeLabel {
  name: string;
  lon: number;
  lat: number;
  important?: boolean;
  city?: boolean;
  water?: boolean;
}

export const LABELS: GlobeLabel[] = [
  { name: "LEBANON", lon: 35.86, lat: 33.9, important: true },
  { name: "Beirut", lon: 35.5, lat: 33.89, city: true },
  { name: "Tripoli", lon: 35.85, lat: 34.44, city: true },
  { name: "Sidon", lon: 35.37, lat: 33.56, city: true },
  { name: "Syria", lon: 38.2, lat: 35.1 },
  { name: "Jordan", lon: 36.1, lat: 31.2 },
  { name: "Cyprus", lon: 33.1, lat: 35.1 },
  { name: "Türkiye", lon: 35.1, lat: 39.0 },
  { name: "Egypt", lon: 30.2, lat: 27.2 },
  { name: "Saudi Arabia", lon: 44.5, lat: 23.5 },
  { name: "Iraq", lon: 43.9, lat: 33.1 },
  { name: "Mediterranean Sea", lon: 30.2, lat: 34.6, water: true },
];

export const MENA_NAMES = new Set([
  "Algeria",
  "Bahrain",
  "Cyprus",
  "Djibouti",
  "Egypt",
  "Iran",
  "Iraq",
  "Israel",
  "Jordan",
  "Kuwait",
  "Lebanon",
  "Libya",
  "Mauritania",
  "Morocco",
  "Oman",
  "Palestine",
  "Qatar",
  "Saudi Arabia",
  "Somalia",
  "Sudan",
  "Syria",
  "Tunisia",
  "Turkey",
  "United Arab Emirates",
  "Yemen",
  "Western Sahara",
  "W. Sahara",
  "S. Sudan",
]);

export const clamp = (v: number, min = 0, max = 1): number =>
  Math.max(min, Math.min(max, v));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const easeOutCubic = (t: number): number =>
  1 - Math.pow(1 - clamp(t), 3);

export const merc = (lat: number): number =>
  Math.log(Math.tan(Math.PI / 4 + (clamp(lat, -84, 84) * DEG) / 2));

export const rad = (lon: number): number => lon * DEG;

export interface GeoJsonFeature {
  type: "Feature";
  properties: {
    ADMIN?: string;
    NAME?: string;
    NAME_LONG?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  } | null;
}

export interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export const countryName = (f: GeoJsonFeature): string =>
  f.properties.ADMIN || f.properties.NAME_LONG || f.properties.NAME || "";

export const isMena = (f: GeoJsonFeature): boolean =>
  MENA_NAMES.has(countryName(f)) ||
  MENA_NAMES.has(String(f.properties.NAME)) ||
  MENA_NAMES.has(String(f.properties.NAME_LONG));

export function eachRing(
  feature: GeoJsonFeature,
  cb: (ring: number[][], feature: GeoJsonFeature) => void,
): void {
  const geom = feature.geometry;
  if (!geom) return;
  if (geom.type === "Polygon") {
    (geom.coordinates as number[][][]).forEach((r) => cb(r, feature));
  } else if (geom.type === "MultiPolygon") {
    (geom.coordinates as number[][][][]).forEach((poly) =>
      poly.forEach((r) => cb(r, feature)),
    );
  }
}

export interface SphereParams {
  cx: number;
  cy: number;
  r: number;
  centerLon: number;
  centerLat: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
}

export function sphereProject(
  lon: number,
  lat: number,
  params: SphereParams,
): ProjectedPoint {
  const lambda = (lon - params.centerLon) * DEG;
  const phi = lat * DEG;
  const phi0 = params.centerLat * DEG;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosPhi0 = Math.cos(phi0);
  const sinPhi0 = Math.sin(phi0);
  const x = cosPhi * Math.sin(lambda);
  const y = cosPhi0 * sinPhi - sinPhi0 * cosPhi * Math.cos(lambda);
  const z = sinPhi0 * sinPhi + cosPhi0 * cosPhi * Math.cos(lambda);
  return { x: params.cx + params.r * x, y: params.cy - params.r * y, z };
}

export interface FlatParams {
  cx: number;
  cy: number;
  centerLon: number;
  centerLat: number;
  scale: number;
}

export function flatProject(
  lon: number,
  lat: number,
  p: FlatParams,
): { x: number; y: number } {
  return {
    x: p.cx + (rad(lon) - rad(p.centerLon)) * p.scale,
    y: p.cy - (merc(lat) - merc(p.centerLat)) * p.scale,
  };
}
