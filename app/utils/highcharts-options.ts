export type ChartOptions = Record<string, unknown>;

function isChartOptions(value: unknown): value is ChartOptions {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
