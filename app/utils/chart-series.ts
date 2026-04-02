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
