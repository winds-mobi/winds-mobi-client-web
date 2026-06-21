export interface TemperatureColourBand {
  color: string;
  max: number;
  textClass: string;
}

export interface TemperatureColourZone {
  color: string;
  value?: number;
}

const TEMPERATURE_COLOUR_BANDS: TemperatureColourBand[] = [
  { color: '#c4b5fd', max: -10, textClass: 'text-violet-300' }, // Violet below -10°C
  { color: '#7dd3fc', max: 0, textClass: 'text-sky-300' }, // Sky blue for -10 to 0°C
  { color: '#1d4ed8', max: 10, textClass: 'text-blue-700' }, // Blue for 0-10°C
  { color: '#16a34a', max: 20, textClass: 'text-green-600' }, // Green for 10-20°C
  { color: '#eab308', max: 30, textClass: 'text-yellow-500' }, // Yellow for 20-30°C
  { color: '#f97316', max: 40, textClass: 'text-orange-500' }, // Orange for 30-40°C
  { color: '#dc2626', max: Infinity, textClass: 'text-red-600' }, // Red for 40°C+
];

export function temperatureBandFor(value: number): TemperatureColourBand {
  for (const band of TEMPERATURE_COLOUR_BANDS) {
    if (value < band.max) {
      return band;
    }
  }

  return TEMPERATURE_COLOUR_BANDS[TEMPERATURE_COLOUR_BANDS.length - 1]!;
}

export function temperatureToTextClass(value: number): string {
  return temperatureBandFor(value).textClass;
}

// Highcharts zones (used by the air chart) need concrete colours, not Tailwind
// classes, so this shares the same band thresholds/colours as
// temperatureToTextClass rather than letting the chart and the metric card
// drift apart.
export function temperatureColourZones(): TemperatureColourZone[] {
  return TEMPERATURE_COLOUR_BANDS.map((band) => {
    if (Number.isFinite(band.max)) {
      return { color: band.color, value: band.max };
    }

    return { color: band.color };
  });
}
