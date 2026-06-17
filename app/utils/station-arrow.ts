import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';

// Two whole-marker shapes that share a circular hub: regular stations get the
// rounded-shoulder arrow; peaks get the v1 "star"-shouldered arrow so they read
// as a different shape (echoing the round/triangle distinction of the v1 map).
// Each shape has its own viewBox; both are 340 units tall so they render at the
// same on-screen size, and each rotates around its own viewBox centre.
//
// These constants are the single source of truth for the arrow geometry, shared
// by the on-map marker ([app/components/map/station-marker.gts]) and the dynamic
// browser favicon ([app/utils/station-favicon.ts]).
export const STATION_ARROW_PATH =
  'M -60,147.1 C -31.1,138.5 -10,111.7 -10,80 -10,48.3 -31.1,21.5 -60,12.9 V -70 h -40 v 82.9 c -28.9,8.6 -50,35.4 -50,67.1 0,31.7 21.1,58.5 50,67.1 V 195 l -50,-25 70,100 70,-100 -50,25 z M -115,80 c 0,-19.3 15.7,-35 35,-35 19.3,0 35,15.7 35,35 0,19.3 -15.7,35 -35,35 -19.3,0 -35,-15.7 -35,-35 z';
export const STATION_ARROW_VIEW_BOX = '-150 -70 140 340';
export const STATION_ARROW_ROTATION_CENTRE = '-80 100';
export const STATION_PEAK_ARROW_PATH =
  'M20,67.4L88.3-51H20v-99h-40v99h-68.3L-20,67.4V115l-50-25L0,190L70,90l-50,25V67.4z M-35,0c0-19.3,15.7-35,35-35S35-19.3,35,0S19.3,35,0,35S-35,19.3-35,0z';
export const STATION_PEAK_ARROW_VIEW_BOX = '-89 -150 178 340';
export const STATION_PEAK_ARROW_ROTATION_CENTRE = '0 20';

// The on-map marker leans on `overflow-visible` so the rotating arrow may spill
// past its (tall, narrow) viewBox. A clipped context like a favicon can't do
// that, so each shape also carries a square viewBox centred on its rotation
// centre, large enough to contain the arrow at any rotation plus the outline.
export const STATION_ARROW_FAVICON_VIEW_BOX = '-300 -120 440 440';
export const STATION_PEAK_ARROW_FAVICON_VIEW_BOX = '-220 -200 440 440';

const STALE_READING_THRESHOLD = 24 * 60 * 60 * 1000;
export const STALE_STATION_COLOUR = 'rgb(148, 163, 184)';

// Every arrow always carries the same plain black hairline outline; it just
// separates the marker from the map and never changes. `paint-order="stroke"`
// paints the stroke first and the fill on top, so the fill covers the inner
// half of the stroke and only its outer half shows — the outline grows outward
// instead of eating into the arrow body. The outline stays hairline even though
// the marker is drawn larger (see the marker's `h-*`/`w-*`).
export const MARKER_PLAIN_OUTLINE_COLOUR = 'rgb(0, 0, 0)';
export const MARKER_OUTLINE_WIDTH = '12';

// The hub baked into each arrow path is a hole (the inner circle winds opposite
// the body, so the non-zero fill rule punches it out). The gust reading is shown
// by filling a disc in the gusts colour *behind* the arrow: it shows through the
// hole, framed by the arrow's own hairline hub outline. Drawn only when the gust
// speed falls in a different wind band than the average, so the hub lights up
// only when gusts add information. The disc radius matches the hole.
export const STATION_ARROW_HUB_RADIUS = 35;

export interface StationArrowGeometry {
  path: string;
  viewBox: string;
  rotationCentre: string;
  faviconViewBox: string;
  // Centre of the hub circle baked into the path (in the shape's own units),
  // around which the gusts ring is drawn.
  hubCx: number;
  hubCy: number;
}

export function stationArrowGeometry(isPeak: boolean): StationArrowGeometry {
  return isPeak
    ? {
        path: STATION_PEAK_ARROW_PATH,
        viewBox: STATION_PEAK_ARROW_VIEW_BOX,
        rotationCentre: STATION_PEAK_ARROW_ROTATION_CENTRE,
        faviconViewBox: STATION_PEAK_ARROW_FAVICON_VIEW_BOX,
        hubCx: 0,
        hubCy: 0,
      }
    : {
        path: STATION_ARROW_PATH,
        viewBox: STATION_ARROW_VIEW_BOX,
        rotationCentre: STATION_ARROW_ROTATION_CENTRE,
        faviconViewBox: STATION_ARROW_FAVICON_VIEW_BOX,
        hubCx: -80,
        hubCy: 80,
      };
}

// Fresh readings are drawn fully opaque; older ones fade toward this floor so
// stale stations recede on the map without ever vanishing. The floor keeps even
// day-old stations (already greyed by `colourForWindReading`) faintly visible.
export const MIN_MARKER_OPACITY = 0.25;

// Once a reading reaches this age it sits at the opacity floor; everything older
// stays there. Readings fade along a cubic ease-in between fresh and this age.
const MARKER_FULLY_FADED_AGE = 30 * 60 * 1000;

// The fade follows `progress^EXPONENT`, so a higher exponent keeps the arrow
// near-opaque early and concentrates the drop near the end. Cubic (3) holds the
// first ~third of the window almost fully opaque then falls away quickly, giving
// the target feel: ≈1.0 at 10 min, ≈0.78 at 20 min, dropping to the floor by 30.
const MARKER_FADE_EXPONENT = 3;

// Opacity for a reading of the given age (epoch ms): fully opaque when fresh,
// holding near-opaque for the first several minutes and then dropping faster
// toward MIN_MARKER_OPACITY as it nears MARKER_FULLY_FADED_AGE. Future or
// unknown timestamps are treated as fully fresh.
export function opacityForReadingAge(timestamp: number): number {
  if (!Number.isFinite(timestamp)) {
    return 1;
  }

  const age = Date.now() - timestamp;
  if (age <= 0) {
    return 1;
  }

  const progress = Math.min(1, age / MARKER_FULLY_FADED_AGE);
  const fade = progress ** MARKER_FADE_EXPONENT;
  return 1 - (1 - MIN_MARKER_OPACITY) * fade;
}

// A reading older than a day is drawn grey rather than in its wind-speed colour.
export function colourForWindReading(speed: number, timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    return windToColour(speed);
  }

  return Date.now() - timestamp > STALE_READING_THRESHOLD
    ? STALE_STATION_COLOUR
    : windToColour(speed);
}
