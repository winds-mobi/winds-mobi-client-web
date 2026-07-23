import type {
  Chart,
  Options,
  PointOptionsType,
  SeriesOptionsType,
} from 'highcharts';
import type { ChartOptions } from 'winds-mobi-client-web/utils/highcharts-options';

// Highcharts' real `SeriesOptionsType` is a big discriminated union requiring
// a specific `type` per series kind, which is more rigidity than this app's
// own loosely-typed chart options buy in elsewhere (see `ChartOptions` in
// utils/highcharts-options.ts) -- so series data is typed loosely here too,
// with a real `name` (used below to match series across updates) as the one
// thing this module actually depends on, and cast to `SeriesOptionsType` at
// the point of actually calling into Highcharts.
export interface NamedSeriesOptions {
  name: string;
  data?: unknown;
  [key: string]: unknown;
}

// Applies new options/series to an already-constructed chart in place,
// without ever asking Highcharts to match old points to new ones by id or
// x value. `Series#setData`'s point-matching (its `updatePoints` argument,
// true by default) is what caused issue #111: two stations' data -- or a
// single station's own sliding refresh window -- can coincidentally share
// an x value (a coarse 0-360 wind direction, or a timestamp), and matching
// on that shared value displaces a point to the wrong array position.
// Passing `updatePoints: false` here means there is no matching step at all
// to get wrong -- every update fully replaces a series' data from the given
// array's own order, by construction.
export function updateChart(
  chart: Chart,
  chartOptions: ChartOptions,
  seriesData: NamedSeriesOptions[] | undefined
): void {
  chart.update(chartOptions as Options, false);

  if (!seriesData) {
    return;
  }

  const incomingByName = new Map(
    seriesData.map((series) => [series.name, series])
  );

  // Remove series no longer present, matching by name (not array index --
  // series can be added/removed independently of each other, e.g. the air
  // chart's gusts hub only showing for some readings).
  for (const series of [...chart.series]) {
    if (series.name && !incomingByName.has(series.name)) {
      series.remove(false);
    }
  }

  const existingByName = new Map(
    chart.series.map((series) => [series.name, series])
  );

  for (const options of seriesData) {
    const existing = existingByName.get(options.name);

    if (existing) {
      const { data, ...rest } = options;
      existing.update(rest as unknown as SeriesOptionsType, false);
      existing.setData(
        (data as PointOptionsType[] | undefined) ?? [],
        false,
        false,
        false
      );
    } else {
      chart.addSeries(options as unknown as SeriesOptionsType, false);
    }
  }

  chart.redraw();
}
