// Text-colour bands for a reading's "updated" time: dark gold when just in,
// fading to grey as the reading ages. The final band's colour matches
// STALE_STATION_COLOUR (app/utils/station-arrow.ts) so stale text and stale
// map markers agree on what "grey" means. Classes come from the
// --color-fresh-* tokens in app/styles/app.css.
const READING_FRESHNESS_BANDS: { maxAgeMs: number; textClass: string }[] = [
  { maxAgeMs: 10 * 60 * 1000, textClass: 'text-fresh-0' },
  { maxAgeMs: 30 * 60 * 1000, textClass: 'text-fresh-1' },
  { maxAgeMs: 60 * 60 * 1000, textClass: 'text-fresh-2' },
  { maxAgeMs: 4 * 60 * 60 * 1000, textClass: 'text-fresh-3' },
  { maxAgeMs: 12 * 60 * 60 * 1000, textClass: 'text-fresh-4' },
  { maxAgeMs: Infinity, textClass: 'text-fresh-5' },
];

export function textClassForReadingAge(timestamp: number): string {
  const lastBand = READING_FRESHNESS_BANDS[READING_FRESHNESS_BANDS.length - 1];

  if (!Number.isFinite(timestamp)) {
    return lastBand!.textClass;
  }

  const age = Date.now() - timestamp;

  for (const band of READING_FRESHNESS_BANDS) {
    if (age <= band.maxAgeMs) {
      return band.textClass;
    }
  }

  return lastBand!.textClass;
}
