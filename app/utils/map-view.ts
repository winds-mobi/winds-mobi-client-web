export const DEFAULT_MAP_LNG = 7.85;
export const DEFAULT_MAP_LAT = 46.68;
export const DEFAULT_MAP_ZOOM = 13;

const COORDINATE_PRECISION = 5;
const ZOOM_PRECISION = 2;

export type MapCoordinate = [number, number];

export type MapView = {
  longitude: number;
  latitude: number;
  zoom: number;
};

export type MapQueryParams = {
  mapLng?: number | string;
  mapLat?: number | string;
  mapZoom?: number | string;
};

function round(value: number, precision: number) {
  return Number(value.toFixed(precision));
}

function parseNumber(
  value: number | string | undefined,
  fallback: number
): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number.parseFloat(value);
  }

  return fallback;
}

export function normalizeMapView(view: MapView): MapView {
  return {
    longitude: round(view.longitude, COORDINATE_PRECISION),
    latitude: round(view.latitude, COORDINATE_PRECISION),
    zoom: round(view.zoom, ZOOM_PRECISION),
  };
}

export function parseMapView(queryParams?: MapQueryParams): MapView {
  return normalizeMapView({
    longitude: parseNumber(queryParams?.mapLng, DEFAULT_MAP_LNG),
    latitude: parseNumber(queryParams?.mapLat, DEFAULT_MAP_LAT),
    zoom: parseNumber(queryParams?.mapZoom, DEFAULT_MAP_ZOOM),
  });
}

export function serializeMapView(view: MapView): Required<MapQueryParams> {
  const normalized = normalizeMapView(view);

  return {
    mapLng: normalized.longitude,
    mapLat: normalized.latitude,
    mapZoom: normalized.zoom,
  };
}

export function mapViewsEqual(left: MapView, right: MapView) {
  const normalizedLeft = normalizeMapView(left);
  const normalizedRight = normalizeMapView(right);

  return (
    normalizedLeft.longitude === normalizedRight.longitude &&
    normalizedLeft.latitude === normalizedRight.latitude &&
    normalizedLeft.zoom === normalizedRight.zoom
  );
}

export function isMapRoute(routeName: string | undefined) {
  return routeName === 'map' || routeName?.startsWith('map.') || false;
}
