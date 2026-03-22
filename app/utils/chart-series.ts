export type TimeSeriesPoint = [number, number | null];

export function buildTimeSeriesData<T>(
  rows: T[],
  xValue: (row: T) => number,
  yValue: (row: T) => number
) {
  return rows
    .reduce<TimeSeriesPoint[]>((points, row) => {
      const timestamp = xValue(row);

      if (!Number.isFinite(timestamp)) {
        return points;
      }

      const value = yValue(row);

      points.push([timestamp, Number.isFinite(value) ? value : null]);

      return points;
    }, [])
    .sort((left, right) => left[0] - right[0]);
}
