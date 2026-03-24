export type TimeSeriesPoint = [number, number | null];

export function sortByNumericValue<T>(
  values: T[],
  numericValue: (value: T) => number
) {
  return [...values].sort(
    (left, right) => numericValue(left) - numericValue(right)
  );
}

export function buildTimeSeriesData<T>(
  rows: T[],
  xValue: (row: T) => number,
  yValue: (row: T) => number
) {
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
