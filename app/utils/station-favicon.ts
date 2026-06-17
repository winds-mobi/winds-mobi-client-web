import {
  colourForWindReading,
  MARKER_CONTRAST_OUTLINE_COLOUR,
  MARKER_CONTRAST_OUTLINE_WIDTH,
  MARKER_GUSTS_OUTLINE_WIDTH,
  stationArrowGeometry,
} from 'winds-mobi-client-web/utils/station-arrow';
import type { Station } from 'winds-mobi-client-web/services/store';

// `windToColour` yields the wind-band colour as a CSS custom property reference
// (`var(--color-wind-XX)`), which resolves against the live document for the
// on-map marker. A favicon is rendered as an isolated SVG document where those
// variables are undefined, so resolve them to concrete `rgb(...)` values here.
// Keeping the CSS as the single source of truth (rather than duplicating the
// RGB table) means the favicon tracks any palette change automatically.
function resolveColour(colour: string): string {
  const match = colour.match(/^var\((--[\w-]+)\)$/);

  if (!match || typeof document === 'undefined') {
    return colour;
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(match[1] as string)
    .trim();

  return value || colour;
}

// Builds an `image/svg+xml` data URI of the station's wind arrow, mirroring the
// on-map marker (wind-speed fill, gusts-coloured outline over a black contrast
// rim, rotated to the wind direction) so a selected station's reading is visible
// in the browser tab.
export function stationFaviconDataUri(station: Station): string {
  const geometry = stationArrowGeometry(station.isPeak);
  const { direction, speed, gusts, timestamp } = station.last;
  const fill = resolveColour(colourForWindReading(speed, timestamp));
  const gustsColour = resolveColour(colourForWindReading(gusts, timestamp));

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="${geometry.faviconViewBox}">` +
    `<g transform="rotate(${direction} ${geometry.rotationCentre})">` +
    `<path d="${geometry.path}" fill="${fill}" stroke="${MARKER_CONTRAST_OUTLINE_COLOUR}" stroke-linecap="round" stroke-linejoin="round" stroke-width="${MARKER_CONTRAST_OUTLINE_WIDTH}"/>` +
    `<path d="${geometry.path}" fill="${fill}" stroke="${gustsColour}" stroke-linecap="round" stroke-linejoin="round" stroke-width="${MARKER_GUSTS_OUTLINE_WIDTH}"/>` +
    `</g></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
