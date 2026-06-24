import type { Map as MaplibreMap } from 'ember-maplibre-gl';

// Whole-Switzerland overview: the default when no view is in the URL and the
// user's location is unavailable (see issue #32).
export const DEFAULT_MAP_LNG = 8.2275;
export const DEFAULT_MAP_LAT = 46.8011;
export const DEFAULT_MAP_ZOOM = 7;

// Zoom applied whenever the map focuses on a single point of interest — the
// user's location (on load or the geolocate button) or a station (search result,
// station name, nearby card). A comfortable regional area rather than a wide
// country-level or street-level view (see issues #32, #47).
export const FOCUS_ZOOM = 10;
// Query params that focus the map on a single station — shared by every
// station-focusing entry point (search result, station name, nearby card/row)
// so they all land on the same zoom (#47).
export function focusQueryParamsFor(station: {
  latitude: number;
  longitude: number;
}) {
  return {
    latitude: station.latitude,
    longitude: station.longitude,
    zoom: FOCUS_ZOOM,
  };
}

const MAP_REQUEST_COORDINATE_THRESHOLD = 0.01;
const MAP_REQUEST_ZOOM_THRESHOLD = 0.25;

// MapLibre defines zoom against a 512px world tile, so the whole 360° of
// longitude spans `MAP_TILE_SIZE * 2 ** zoom` pixels at a given zoom.
const MAP_TILE_SIZE = 512;

type MapCoordinate = [number, number];

export type MapBounds = {
  northEast: MapCoordinate;
  southWest: MapCoordinate;
};

export type MapView = {
  longitude: number;
  latitude: number;
  zoom: number;
};

// Query params share the `MapView` field names so a routed view round-trips
// without any renaming — `parseMapView` only parses/defaults, and a `MapView`
// *is* the query-param object.
export type MapQueryParams = {
  longitude?: number | string;
  latitude?: number | string;
  zoom?: number | string;
};

function parseNumber(
  value: number | string | undefined,
  fallback: number
): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function snap(value: number, step: number) {
  return Math.round(value / step) * step;
}

// Snap a view to the station-refetch thresholds so that small map movements
// resolve to the same value. The map request is derived from this, which lets
// sub-threshold panning update the URL without triggering a refetch — keeping
// station fetching declaratively driven by the routed view instead of imperative
// viewport bookkeeping.
export function quantizeMapViewForRequest(view: MapView): MapView {
  return {
    longitude: snap(view.longitude, MAP_REQUEST_COORDINATE_THRESHOLD),
    latitude: snap(view.latitude, MAP_REQUEST_COORDINATE_THRESHOLD),
    zoom: snap(view.zoom, MAP_REQUEST_ZOOM_THRESHOLD),
  };
}

// Normalised Web-Mercator Y for a latitude: 0 at the top of the world, 1 at the
// bottom (the projection MapLibre uses).
function latitudeToMercatorY(latitude: number): number {
  const latitudeRadians = (latitude * Math.PI) / 180;
  return (1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2;
}

function mercatorYToLatitude(y: number): number {
  return (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;
}

// The geographic bounds actually visible for a routed view in a viewport of the
// given pixel size — the same Web-Mercator math MapLibre's own `getBounds` uses.
// The earlier heuristic spanned a fixed `360 / 2 ** zoom` degrees regardless of
// the map's real width, so it matched only a ~1024px-wide viewport and
// under-fetched the edges of any larger map (the request box looked smaller than
// the map shows). Deriving from the measured viewport size fixes that, while
// keeping the request a function of the routed view (center/zoom) plus the
// container's pixel dimensions.
export function mapBoundsFromView(
  view: MapView,
  viewportWidth: number,
  viewportHeight: number
): MapBounds {
  const worldSize = MAP_TILE_SIZE * 2 ** view.zoom;
  const halfWidthDegrees = ((viewportWidth / 2) * 360) / worldSize;

  const centerY = latitudeToMercatorY(view.latitude);
  const halfHeightY = viewportHeight / 2 / worldSize;

  return {
    northEast: [
      view.longitude + halfWidthDegrees,
      mercatorYToLatitude(centerY - halfHeightY),
    ],
    southWest: [
      view.longitude - halfWidthDegrees,
      mercatorYToLatitude(centerY + halfHeightY),
    ],
  };
}

export function parseMapView(queryParams?: MapQueryParams): MapView {
  return {
    longitude: parseNumber(queryParams?.longitude, DEFAULT_MAP_LNG),
    latitude: parseNumber(queryParams?.latitude, DEFAULT_MAP_LAT),
    zoom: parseNumber(queryParams?.zoom, DEFAULT_MAP_ZOOM),
  };
}

export function mapViewFromMap(map: MaplibreMap): MapView {
  const center = map.getCenter();

  return {
    latitude: center.lat,
    longitude: center.lng,
    zoom: map.getZoom(),
  };
}

export function mapViewsEqual(left: MapView, right: MapView) {
  return (
    left.longitude === right.longitude &&
    left.latitude === right.latitude &&
    left.zoom === right.zoom
  );
}
