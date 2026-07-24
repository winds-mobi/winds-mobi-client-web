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
// stays there. Readings shrink linearly between fresh and this age.
const MARKER_FULLY_SHRUNK_AGE = 30 * 60 * 1000;

// Scale for a reading of the given age (epoch ms): full size when fresh, shrinking
// linearly to MIN_MARKER_SCALE at MARKER_FULLY_SHRUNK_AGE (≈1/2 size at 30 min)
// and holding the floor for anything older. Future or unknown timestamps are
// treated as fully fresh.
export function scaleForReadingAge(timestamp: number): number {
  if (!Number.isFinite(timestamp)) {
    return 1;
  }

  const age = Date.now() - timestamp;
  if (age <= 0) {
    return 1;
  }

  const progress = Math.min(1, age / MARKER_FULLY_SHRUNK_AGE);
  return 1 - (1 - MIN_MARKER_SCALE) * progress;
}

// Marker scale steps by map zoom, so arrows don't dwarf the map when zoomed
// out to see a whole region. Deliberately discrete steps rather than a
// continuous function: the routed `zoom` query param this reads only updates
// once a pan/zoom gesture settles (see CLAUDE.md's map-state architecture),
// so markers only ever need to hold one of a handful of sizes at a time.
const ZOOM_SCALE_STEPS: readonly (readonly [minZoom: number, scale: number])[] =
  [
    [13, 1],
    [11, 0.8],
    [9, 0.65],
    [7, 0.5],
  ];
export const MIN_ZOOM_MARKER_SCALE = 0.4;

export function scaleForZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) {
    return 1;
  }

  for (const [minZoom, scale] of ZOOM_SCALE_STEPS) {
    if (zoom >= minZoom) {
      return scale;
    }
  }

  return MIN_ZOOM_MARKER_SCALE;
}

// Grows the arrow past its baseline (which matches the ring's own fixed size)
// via the CSS `transform: scale(...)` that `markerScale` already drives —
// tuning the arrow/svg's own Tailwind `h-*`/`w-*` classes turned out not to
// visibly change anything (untraced further; suspected Tailwind-generation or
// overflow quirk), whereas this transform is the same mechanism the age/zoom
// shrink already uses and is proven to render. The ring lives on a separate,
// unscaled ancestor (see `map/station-marker.gts`), so this constant is free
// to tune without affecting the ring at all.
export const ARROW_SCALE = 1.2;

// A reading older than a day is drawn grey rather than in its wind-speed colour.
export function colourForWindReading(speed: number, timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    return windToColour(speed);
  }

  return Date.now() - timestamp > STALE_READING_THRESHOLD
    ? STALE_STATION_COLOUR
    : windToColour(speed);
}
