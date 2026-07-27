import type { IntlService } from 'ember-intl';
import type { History } from 'winds-mobi-client-web/services/store.js';
import azimuthToCardinal from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';
import { buildTimeSeriesData, buildWindbarbData } from './chart-series';

export type ChartOptions = Record<string, unknown>;

function isChartOptions(value: unknown): value is ChartOptions {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface YAxisOverrides {
  labels?: { format?: string };
  opposite?: boolean;
  style?: Record<string, unknown>;
}

export function defaultYAxis(overrides: YAxisOverrides = {}) {
  const { labels, ...rest } = overrides;
  return {
    endOnTick: false,
    maxPadding: 0.04,
    minPadding: 0.02,
    opposite: false,
    softMin: 0,
    startOnTick: false,
    tickAmount: 5,
    title: { text: null },
    labels: {
      style: { fontSize: '12px' },
      ...labels,
    },
    ...rest,
  };
}

type NumericHistoryKey =
  | 'direction'
  | 'speed'
  | 'gusts'
  | 'temperature'
  | 'humidity'
  | 'rain';

export function seriesFor(history: History[], key: NumericHistoryKey) {
  return buildTimeSeriesData(
    history,
    (elm) => elm.timestamp,
    (elm) => elm[key]
  );
}

// Highcharts' windbarb series expects wind speed in meters per second (its
// barb shape is derived from Beaufort thresholds defined in m/s) -- this
// app stores and displays speed in km/h everywhere else.
const KM_H_PER_M_S = 3.6;

export function windbarbSeriesFor(history: History[], intl: IntlService) {
  return buildWindbarbData(
    history,
    (elm) => elm.timestamp,
    (elm) => elm.speed / KM_H_PER_M_S,
    (elm) => elm.direction,
    (elm) => windToColour(elm.speed),
    (elm) =>
      `${azimuthToCardinal(elm.direction)} ${intl.t('format.azimuth', {
        azimuth: elm.direction,
      })}`
  );
}

export function mergeChartOptions<T extends ChartOptions>(
  defaults: T,
  overrides: Partial<T> | undefined,
  nestedKeys: Array<keyof T>
) {
  const merged: ChartOptions = {
    ...defaults,
    ...overrides,
  };

  if (!overrides) {
    return merged as T;
  }

  for (const key of nestedKeys) {
    const defaultValue = defaults[key];
    const overrideValue = overrides[key];

    if (isChartOptions(defaultValue) && isChartOptions(overrideValue)) {
      merged[key as string] = {
        ...defaultValue,
        ...overrideValue,
      };
    }
  }

  return merged as T;
}
