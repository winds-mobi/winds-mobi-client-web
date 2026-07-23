import { DIRECTIONS } from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';

// The 4 cardinal directions are the even indices into DIRECTIONS (N=0, E=2,
// S=4, W=6); the diagonals (NE/SE/SW/NW) are the odd ones. Used where there's
// only room for the basic compass points, not the full 8-way set.
export function cardinalOnlyDirectionLabel(value: number): string {
  const index = Math.round(value / 45) % 8;

  return index % 2 === 0 ? DIRECTIONS[index]! : '';
}

// Every visible label in the cardinal-only set is exactly one character
// (N/E/S/W); a proportional font renders single glyphs at noticeably
// different widths (a thin "I"-like stroke vs. a wide "W"), which looks
// inconsistent once every label is down to just one letter. A monospace
// font keeps them visually uniform.
export const COMPASS_LABEL_FONT_FAMILY = 'ui-monospace, monospace';
