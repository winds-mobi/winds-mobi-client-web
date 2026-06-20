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

const WORLD_LONGITUDE_SPAN = 360;
const WORLD_LATITUDE_SPAN = 170;

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

export function approximateMapBoundsFromView(view: MapView): MapBounds {
  const longitudeSpan = WORLD_LONGITUDE_SPAN / 2 ** view.zoom;
  const latitudeSpan = WORLD_LATITUDE_SPAN / 2 ** view.zoom;

  return {
    northEast: [view.longitude + longitudeSpan, view.latitude + latitudeSpan],
    southWest: [view.longitude - longitudeSpan, view.latitude - latitudeSpan],
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
