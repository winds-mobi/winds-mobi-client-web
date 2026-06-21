export interface ReadingFreshnessLegendBand {
  backgroundClass: string;
  label: string;
}

// Text-colour bands for a reading's "updated" time: glowing gold when just
// in, through dark gold, fading to grey as the reading ages. Thresholds
// follow the Fibonacci sequence in minutes (1/2/3/5/8/13/21/34/55, skipping
// the repeated leading 1), with anything older than 55 minutes landing on
// the final flat-grey band -- matching STALE_STATION_COLOUR in
// app/utils/station-arrow.ts, so stale text and stale map markers agree on
// what "grey" means. Classes come from the --color-fresh-* tokens in
// app/styles/app.css.
const READING_FRESHNESS_BANDS: {
  maxAgeMs: number;
  backgroundClass: string;
  textClass: string;
}[] = [
  {
    maxAgeMs: 1 * 60 * 1000,
    backgroundClass: 'bg-fresh-0',
    textClass: 'text-fresh-0',
  },
  {
    maxAgeMs: 2 * 60 * 1000,
    backgroundClass: 'bg-fresh-1',
    textClass: 'text-fresh-1',
  },
  {
    maxAgeMs: 3 * 60 * 1000,
    backgroundClass: 'bg-fresh-2',
    textClass: 'text-fresh-2',
  },
  {
    maxAgeMs: 5 * 60 * 1000,
    backgroundClass: 'bg-fresh-3',
    textClass: 'text-fresh-3',
  },
  {
    maxAgeMs: 8 * 60 * 1000,
    backgroundClass: 'bg-fresh-4',
    textClass: 'text-fresh-4',
  },
  {
    maxAgeMs: 13 * 60 * 1000,
    backgroundClass: 'bg-fresh-5',
    textClass: 'text-fresh-5',
  },
  {
    maxAgeMs: 21 * 60 * 1000,
    backgroundClass: 'bg-fresh-6',
    textClass: 'text-fresh-6',
  },
  {
    maxAgeMs: 34 * 60 * 1000,
    backgroundClass: 'bg-fresh-7',
    textClass: 'text-fresh-7',
  },
  {
    maxAgeMs: 55 * 60 * 1000,
    backgroundClass: 'bg-fresh-8',
    textClass: 'text-fresh-8',
  },
  {
    maxAgeMs: Infinity,
    backgroundClass: 'bg-fresh-9',
    textClass: 'text-fresh-9',
  },
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

function formatAgeLabel(ms: number): string {
  return ms < 60 * 60 * 1000
    ? `${ms / (60 * 1000)}m`
    : `${ms / (60 * 60 * 1000)}h`;
}

export function readingFreshnessLegendBands(): ReadingFreshnessLegendBand[] {
  return READING_FRESHNESS_BANDS.map((band, index) => {
    if (Number.isFinite(band.maxAgeMs)) {
      return {
        backgroundClass: band.backgroundClass,
        label: formatAgeLabel(band.maxAgeMs),
      };
    }

    const previousMaxAgeMs = READING_FRESHNESS_BANDS[index - 1]?.maxAgeMs ?? 0;

    return {
      backgroundClass: band.backgroundClass,
      label: `${formatAgeLabel(previousMaxAgeMs)}+`,
    };
  });
}
