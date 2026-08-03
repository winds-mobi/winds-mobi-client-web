// MapLibre GL JS creates its rendering context via
// `canvas.getContext('webgl2') || canvas.getContext('webgl')` and throws
// ("Failed to initialize WebGL") if both come back null — see maplibre-gl's
// Map/Painter source. Without one, MapLibre's `idle` event — which this
// app's map-state architecture depends on for bounds-driven refetching (see
// CLAUDE.md) — never fires, and tests waiting on that behavior hang until
// `waitUntil` times out rather than failing fast.
//
// The dev container has real (software) WebGL as of its Debian/Mesa base
// (see the Dockerfile), so this should evaluate to true there and these
// tests are not expected to be permanently skipped. This check is kept as a
// defensive guard, not a documented environment limitation: if it ever
// starts returning false again (e.g. a regressed container image, or a CI
// runner with no software rendering available), the gated tests degrade to
// a clean skip instead of hanging until `waitUntil` times out.
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');

    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
