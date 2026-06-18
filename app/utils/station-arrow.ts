import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';
import { arrows } from 'virtual:station-arrows';

// Both arrow shapes are generated at build time from their SVGs under
// public/images (arrow-not-peak.svg, arrow-peak.svg) by the `station-arrows` Vite
// plugin, so those SVGs are the single source of truth — edit an SVG to reshape
// its marker. The geometry is shared by the on-map marker
// ([app/components/map/station-marker.gts]) and the dynamic browser favicon
// ([app/utils/station-favicon.ts]). `StationArrowGeometry` re-exports the data
// shape so consumers code against one type.
export type StationArrowGeometry = (typeof arrows)[keyof typeof arrows];

const STALE_READING_THRESHOLD = 24 * 60 * 60 * 1000;
export const STALE_STATION_COLOUR = 'rgb(148, 163, 184)';

// Every arrow carries the same plain black hairline outline; it just separates
// the marker from the map and never changes. `paint-order="stroke"` paints the
// stroke first and the fill on top, so only its outer half shows — the outline
// grows outward instead of eating into the body. The chubby look lives in the
// path geometry itself, not in this outline.
export const MARKER_PLAIN_OUTLINE_COLOUR = 'rgb(0, 0, 0)';
export const MARKER_OUTLINE_WIDTH = '12';

// The arrow artwork points north (up) at rotation 0. Wind `direction` is the
// compass bearing the wind blows *from*, and the arrow should point where it
// blows *to*.
export const ARROW_DIRECTION_OFFSET = 180;

export function stationArrowGeometry(isPeak: boolean): StationArrowGeometry {
  return isPeak ? arrows.peak : arrows.notPeak;
}

// Fresh readings are drawn full size; older ones shrink toward this floor so
// stale stations recede on the map without becoming too small to see or click.
// The floor keeps even day-old stations (already greyed by `colourForWindReading`)
// at half size rather than vanishing.
export const MIN_MARKER_SCALE = 0.5;

// Once a reading reaches this age it sits at the size floor; everything older
// stays there. Readings shrink along a cubic ease-in between fresh and this age.
const MARKER_FULLY_SHRUNK_AGE = 30 * 60 * 1000;

// The shrink follows `progress^EXPONENT`, so a higher exponent keeps the arrow
// near-full-size early and concentrates the shrink near the end. Cubic (3) holds
// the first ~third of the window almost full size then falls away quickly, giving
// the target feel: ≈1.0 at 10 min, ≈0.85 at 20 min, dropping to the floor by 30.
const MARKER_SHRINK_EXPONENT = 3;

// Scale for a reading of the given age (epoch ms): full size when fresh, holding
// near-full-size for the first several minutes and then shrinking faster toward
// MIN_MARKER_SCALE as it nears MARKER_FULLY_SHRUNK_AGE. Future or unknown
// timestamps are treated as fully fresh.
export function scaleForReadingAge(timestamp: number): number {
  if (!Number.isFinite(timestamp)) {
    return 1;
  }

  const age = Date.now() - timestamp;
  if (age <= 0) {
    return 1;
  }

  const progress = Math.min(1, age / MARKER_FULLY_SHRUNK_AGE);
  const shrink = progress ** MARKER_SHRINK_EXPONENT;
  return 1 - (1 - MIN_MARKER_SCALE) * shrink;
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
