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
};

// Unlike buildTimeSeriesData's y-value, an invalid speed/direction here
// drops the point entirely rather than keeping a null placeholder: a
// windbarb point with no value never draws a barb anyway (Highcharts'
// windbarb series requires a non-negative numeric value), and there is no
// second series' y-axis alignment to preserve a gap for.
//
// Deliberately no per-point `color`/tooltip-text fields here (an earlier
// version had them): Highcharts Stock's data grouping recomputes `value`/
// `direction` on a grouped point via windbarb's own vector-average
// approximation, but it does *not* recompute arbitrary extra point
// properties -- a grouped point's `color`/custom fields are silently
// inherited from whichever single raw point happened to start that group,
// so at any zoomed-out range the barb's rotation (correctly averaged) and
// the label (one raw reading, wrong at every other point in the group)
// visibly disagree. Anything derived from `value`/`direction` must be
// (re)computed from the point Highcharts hands back at render/tooltip
// time -- see the Direction series' `zones` and `tooltip.pointFormatter`
// in wind/presenter.gts, which read `this.value`/`this.direction` live
// instead of a baked-in field.
export function buildWindbarbData<T>(
  rows: T[] | null | undefined,
  xValue: (row: T) => number,
  speedValue: (row: T) => number,
  directionValue: (row: T) => number
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

    points.set(x, { x, value, direction });

    return points;
  }, new Map<number, WindbarbPoint>());

  return [...pointsByX.values()];
}
