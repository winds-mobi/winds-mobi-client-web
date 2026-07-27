export type TimeSeriesPoint = [number, number | null];

export function buildTimeSeriesData<T>(
  rows: T[] | null | undefined,
  xValue: (row: T) => number,
  yValue: (row: T) => number
) {
  if (!Array.isArray(rows)) {
    return [];
  }

  const pointsByTimestamp = rows.reduce<Map<number, number | null>>(
    (points, row) => {
      const timestamp = xValue(row);

      if (!Number.isFinite(timestamp)) {
        return points;
      }

      const value = yValue(row);

      points.set(timestamp, Number.isFinite(value) ? value : null);

      return points;
    },
    new Map<number, number | null>()
  );

  return [...pointsByTimestamp.entries()].map(
    ([timestamp, value]) => [timestamp, value] as TimeSeriesPoint
  );
}

export type WindbarbPoint = {
  x: number;
  value: number;
  direction: number;
  color: string;
  customTooltip: string;
};

// Unlike buildTimeSeriesData's y-value, an invalid speed/direction here
// drops the point entirely rather than keeping a null placeholder: a
// windbarb point with no value never draws a barb anyway (Highcharts'
// windbarb series requires a non-negative numeric value), and there is no
// second series' y-axis alignment to preserve a gap for.
export function buildWindbarbData<T>(
  rows: T[] | null | undefined,
  xValue: (row: T) => number,
  speedValue: (row: T) => number,
  directionValue: (row: T) => number,
  colorValue: (row: T) => string,
  customTooltipValue: (row: T) => string
): WindbarbPoint[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  const pointsByX = rows.reduce<Map<number, WindbarbPoint>>((points, row) => {
    const x = xValue(row);
    const value = speedValue(row);
    const direction = directionValue(row);

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(value) ||
      value < 0 ||
      !Number.isFinite(direction)
    ) {
      return points;
    }

    points.set(x, {
      x,
      value,
      direction,
      color: colorValue(row),
      customTooltip: customTooltipValue(row),
    });

    return points;
  }, new Map<number, WindbarbPoint>());

  return [...pointsByX.values()];
}
