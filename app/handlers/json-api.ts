// Wraps already-reshaped, id-stamped handler content in the minimal JSON:API
// document the Warp Drive cache expects: a `self` link plus the `data`.
export function toJsonApiEnvelope<T>(
  self: string | undefined,
  data: unknown
): T {
  return {
    links: { self },
    data,
  } as T;
}
