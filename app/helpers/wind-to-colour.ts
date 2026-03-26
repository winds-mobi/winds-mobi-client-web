export interface WindColourBand {
  backgroundClass: string;
  color: string;
  key: string;
  min: number;
  max: number;
  textClass: string;
}

export interface WindColourZone {
  color: string;
  value?: number;
}

export interface WindLegendBand {
  backgroundClass: string;
  label: string;
}

const COLORS = [
  {
    backgroundClass: 'bg-wind-05',
    color: 'var(--color-wind-05)',
    key: 'wind-05',
    max: 5,
    textClass: 'text-wind-05',
  }, // Green for <5 km/h
  {
    backgroundClass: 'bg-wind-10',
    color: 'var(--color-wind-10)',
    key: 'wind-10',
    max: 10,
    textClass: 'text-wind-10',
  }, // Light Green for 5-10 km/h
  {
    backgroundClass: 'bg-wind-15',
    color: 'var(--color-wind-15)',
    key: 'wind-15',
    max: 15,
    textClass: 'text-wind-15',
  }, // Teal for 10-15 km/h
  {
    backgroundClass: 'bg-wind-20',
    color: 'var(--color-wind-20)',
    key: 'wind-20',
    max: 20,
    textClass: 'text-wind-20',
  }, // Light Blue for 15-20 km/h
  {
    backgroundClass: 'bg-wind-25',
    color: 'var(--color-wind-25)',
    key: 'wind-25',
    max: 25,
    textClass: 'text-wind-25',
  }, // Blue for 20-25 km/h
  {
    backgroundClass: 'bg-wind-30',
    color: 'var(--color-wind-30)',
    key: 'wind-30',
    max: 30,
    textClass: 'text-wind-30',
  }, // Dark Blue for 25-30 km/h
  {
    backgroundClass: 'bg-wind-35',
    color: 'var(--color-wind-35)',
    key: 'wind-35',
    max: 35,
    textClass: 'text-wind-35',
  }, // Purple for 30-35 km/h
  {
    backgroundClass: 'bg-wind-40',
    color: 'var(--color-wind-40)',
    key: 'wind-40',
    max: 40,
    textClass: 'text-wind-40',
  }, // Magenta for 35-40 km/h
  {
    backgroundClass: 'bg-wind-45',
    color: 'var(--color-wind-45)',
    key: 'wind-45',
    max: 45,
    textClass: 'text-wind-45',
  }, // Pink for 40-45 km/h
  {
    backgroundClass: 'bg-wind-50',
    color: 'var(--color-wind-50)',
    key: 'wind-50',
    max: Infinity,
    textClass: 'text-wind-50',
  }, // Dark Red for >50 km/h
];

export const WIND_COLOUR_BANDS: WindColourBand[] = COLORS.map(
  ({ backgroundClass, color, key, max, textClass }, index) => ({
    backgroundClass,
    color,
    key,
    min: index === 0 ? 0 : (COLORS[index - 1]?.max ?? 0),
    max,
    textClass,
  })
);

export function windBandForSpeed(speed: number) {
  for (const entry of WIND_COLOUR_BANDS) {
    if (speed < entry.max) {
      return entry;
    }
  }

  return (
    WIND_COLOUR_BANDS[WIND_COLOUR_BANDS.length - 1] ?? {
      backgroundClass: 'bg-wind-50',
      color: 'var(--color-wind-50)',
      key: 'wind-50',
      max: Infinity,
      min: 45,
      textClass: 'text-wind-50',
    }
  );
}

export function windToBackgroundClass(speed: number) {
  return windBandForSpeed(speed).backgroundClass;
}

export function windToTextClass(speed: number) {
  return windBandForSpeed(speed).textClass;
}

export function windColourZones() {
  return WIND_COLOUR_BANDS.map((band) => {
    if (Number.isFinite(band.max)) {
      return {
        color: band.color,
        value: band.max,
      };
    }

    return {
      color: band.color,
    };
  }) as WindColourZone[];
}

export function windLegendBands(): WindLegendBand[] {
  return [...WIND_COLOUR_BANDS].reverse().map((band) => ({
    backgroundClass: band.backgroundClass,
    label: Number.isFinite(band.max) ? `${band.max}` : `${band.min}+`,
  }));
}

export default function windToColour(speed: number) {
  return windBandForSpeed(speed).color;
}
