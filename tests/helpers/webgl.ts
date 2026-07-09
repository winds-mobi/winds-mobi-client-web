// MapLibre GL JS creates its rendering context via
// `canvas.getContext('webgl2') || canvas.getContext('webgl')` and throws
// ("Failed to initialize WebGL") if both come back null — see maplibre-gl's
// Map/Painter source. Headless Chromium in this dev container (and in CI)
// has no GPU, and this app's own testem.js explicitly disables the software
// rasterizer fallback (`--disable-software-rasterizer`), so no WebGL context
// is ever available here. Without one, MapLibre's `idle` event — which this
// app's map-state architecture depends on for bounds-driven refetching (see
// CLAUDE.md) — never fires, and tests waiting on that behavior hang until
// `waitUntil` times out rather than failing fast. Skip-guard those specific
// tests with this check instead of leaving them permanently red; see
// TODO.md's "Map-refresh acceptance tests can't run in the dev container".
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');

    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
