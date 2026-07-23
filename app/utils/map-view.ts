import { tracked } from '@glimmer/tracking';
import type { Map as MaplibreMap } from 'ember-maplibre-gl';
import type RouterService from '@ember/routing/router-service';

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

// Captured request bounds are snapped to this grid so sub-threshold panning
// resolves to the same value and doesn't trigger a refetch.
const MAP_REQUEST_COORDINATE_THRESHOLD = 0.01;

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

// The geographic bounds currently visible on the map, read from MapLibre's own
// `getBounds` (the exact viewport in lng/lat). The station request is derived from
// this rather than from the routed center/zoom, so it always covers what's
// actually on screen — including when the map is pitched or rotated. The query's
// `limit` (see `mapQuery`) caps how many stations come back when a pitched view
// reaches far toward the horizon.
export function boundsFromMap(map: MaplibreMap): MapBounds {
  const bounds = map.getBounds();
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();

  return {
    northEast: [northEast.lng, northEast.lat],
    southWest: [southWest.lng, southWest.lat],
  };
}

// Snap bounds to the refetch grid so small map movements resolve to the same
// value and don't trigger a refetch.
export function roundBoundsForRequest(bounds: MapBounds): MapBounds {
  return {
    northEast: [
      snap(bounds.northEast[0], MAP_REQUEST_COORDINATE_THRESHOLD),
      snap(bounds.northEast[1], MAP_REQUEST_COORDINATE_THRESHOLD),
    ],
    southWest: [
      snap(bounds.southWest[0], MAP_REQUEST_COORDINATE_THRESHOLD),
      snap(bounds.southWest[1], MAP_REQUEST_COORDINATE_THRESHOLD),
    ],
  };
}

export function mapBoundsEqual(left?: MapBounds, right?: MapBounds): boolean {
  if (!left || !right) {
    return left === right;
  }

  return (
    left.northEast[0] === right.northEast[0] &&
    left.northEast[1] === right.northEast[1] &&
    left.southWest[0] === right.southWest[0] &&
    left.southWest[1] === right.southWest[1]
  );
}

export function parseMapView(queryParams?: MapQueryParams): MapView {
  return {
    longitude: parseNumber(queryParams?.longitude, DEFAULT_MAP_LNG),
    latitude: parseNumber(queryParams?.latitude, DEFAULT_MAP_LAT),
    zoom: parseNumber(queryParams?.zoom, DEFAULT_MAP_ZOOM),
  };
}

// The routed view parsed from the router's current query params — the `mapView`
// getter shared by the map and station-panel components.
export function currentMapView(router: RouterService): MapView {
  return parseMapView(
    router.currentRoute?.queryParams as MapQueryParams | undefined
  );
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

// Keeps the previous `MapView` reference when the newly parsed one is
// value-equal, rather than handing back `next` unconditionally. This matters
// because `router.currentRoute` (what `currentMapView` reads) gets a brand
// new identity on *every* transition, even one that doesn't touch the map's
// own query params (e.g. selecting a different station, which deliberately
// leaves them untouched -- see `stationSelected` in map/index.gts). A
// `@cached` getter downstream (`flyToOptions`) that depends on the *value*
// of the routed view, not on how many transitions have happened, needs a
// stable reference to key off of -- without this, it recomputes (and the
// declarative `<map.call @func="flyTo">` re-fires) on every single station
// switch, not just ones that actually change the routed view (issue #131).
export function stableMapView(
  previous: MapView | undefined,
  next: MapView
): MapView {
  return previous && mapViewsEqual(previous, next) ? previous : next;
}

// The two coordinates most map-init/fly-to option objects need, in the
// [lng, lat] tuple order MapLibre itself expects.
export function mapViewCenter(view: MapView): [number, number] {
  return [view.longitude, view.latitude];
}

// Tracks the routed `MapView` with a reference that stays stable across
// transitions that don't actually change it, for consumers (e.g. a `@cached`
// getter feeding a declarative `<map.call @func="flyTo">`) that need to key
// off "did the routed view change" rather than "did any transition happen"
// (issue #131) -- `router.currentRoute` gets a brand new identity on *every*
// transition, even one that deliberately leaves the map's own query params
// untouched (selecting a different station).
//
// `sync` must be called from somewhere other than `current`'s own read (a
// modifier hooked to the router's `routeDidChange`, not the getter itself):
// Ember's `@tracked` has no built-in bail-out for a reference-equal
// reassignment -- re-setting a tracked property to its own value is actually
// a documented technique for *forcing* a recompute, the opposite of what's
// needed here. `sync` only assigns when `stableMapView` hands back a
// genuinely different reference, so an unrelated transition never dirties
// anything downstream.
export class TrackedMapView {
  @tracked private lastView?: MapView;
  private router: RouterService;

  constructor(router: RouterService) {
    this.router = router;
  }

  get current(): MapView {
    return this.lastView ?? currentMapView(this.router);
  }

  sync = (): void => {
    const next = stableMapView(this.lastView, currentMapView(this.router));

    if (next !== this.lastView) {
      this.lastView = next;
    }
  };
}
