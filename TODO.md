# TODO

## Exploratory

- **Render map station markers as native MapLibre GL layers instead of per-station DOM
  markers.** Where it lives: `app/components/map/station-marker.gts` (the marker itself)
  and `app/components/map/index.gts` (the `{{#each this.stations as |station|}}` /
  `<map.marker>` loop). Problem: today each station is a real DOM element
  (`<map.marker>`'s `domContent` div) repositioned via JS/CSS `transform` on every map
  frame; that's one HTML node + CSS transform per station (currently capped at 470 by
  `mapQuery`), and it's the same category of "DOM element with its own transform, stacked
  on top of MapLibre's own transformed marker element" that turned out to cause the
  mobile click-reliability bug fixed alongside this TODO entry. A `GeoJSONSource` +
  `symbol`/`circle` layer setup (see MapLibre's own layer/source components,
  `ember-maplibre-gl`'s `<map.source>`/`<source.layer>`) renders all stations as vector
  data on the WebGL canvas instead, with MapLibre's own feature-click hit-testing (pure
  GPU raycasting, no DOM/CSS-transform involved at all) replacing per-marker DOM click
  handling entirely, and scales far better than one DOM node per station. Proposed fix:
  not a quick swap -- would need (1) pre-rasterizing the two arrow shapes
  (`public/images/arrow-not-peak.svg`/`arrow-peak.svg`) into recolorable SDF sprites
  (`map.addImage(..., {sdf: true})`) instead of drawing the SVG paths directly, (2)
  moving per-station rotation/color/scale from the current Ember getters
  (`station-marker.gts`'s `markerColor`/`markerScale`/`markerTransform`) into precomputed
  GeoJSON feature properties consumed via `icon-rotate`/`icon-color`/`icon-size`
  expressions, (3) a separate filtered layer (or paint expression) for the gusts hub and
  the selection ring. Worth prototyping as a throwaway spike first (confirm SDF
  recoloring + rotation actually looks right) before committing to the full rewrite.

## Startup performance

From an audit of first load (2026-07-26), re-checked against production and the current build on
2026-10-01. The finished items are gone from this file; their write-ups are in its git history.

### Baseline

- `assets/main-*.js` — **2192 kB raw / 576 kB gzip / 459 kB brotli**, a single chunk. When
  attributed per package (2026-07-26), `maplibre-gl` was about 1017 kB of it, the largest share.
- `assets/main-*.css` — 223 kB raw / 35 kB gzip.
- Highcharts is off the critical path in three dynamic chunks (`highcharts` 273 kB, `stock`
  111 kB, `highcharts-more` 98 kB raw) — see the Highcharts section in CLAUDE.md.
- The stations API (`/api/2.3/stations/?…`) is gzip-compressed. The origin sends
  `cache-control: no-cache` for `index.html` and `sw.js`.

### Compress `index.html` and `sw.js` at the origin

Where it lives: not this repo — `winds.mobi`'s Caddyfile in
`https://github.com/winds-mobi/winds-mobi-config`.

Problem: `index.html` and `sw.js` are served without `content-encoding`, even when the browser
offers `br`/`gzip` (`index.html` is ~1.8 kB raw, ~0.5 kB brotli). Small, but they gate first paint.

Proposed fix: enable Caddy's `encode zstd gzip` for `text/html` and `application/javascript` on
the origin, keeping the existing `no-cache` headers.

### Defer `maplibre-gl` behind a dynamic import (spike)

Where it lives: [app/components/map/index.gts](app/components/map/index.gts) — static
`import MapLibreGL from 'ember-maplibre-gl/components/maplibre-gl'` and the control imports
from `maplibre-gl`.

Problem: `maplibre-gl` is the largest part of the main chunk and is statically imported, so it
is parsed and evaluated before Ember boots — including on pages that never render a map, such
as Settings and Help. Splitting it into its own chunk via `manualChunks` would NOT
help; only a dynamic `import()` defers it.

Proposed fix: load the MapLibre component and its controls through an ember-concurrency task
doing `await import(…)`, rendering a skeleton (or the existing map chrome) until it resolves,
roughly halving the main chunk. Spike first, because: the control classes are instantiated as
field initializers today and would have to move into the async path; `ember-maplibre-gl`'s own
component graph may pull `maplibre-gl` back in statically; and the acceptance tests that wait
for MapLibre's `idle` event (see CLAUDE.md) are the ones most likely to break. Confirm the split
actually happens by re-measuring the build before committing.

### Show last session's data instantly instead of waiting for the network (spike)

Where it lives: the `runtimeCaching` block in [vite.config.mjs](vite.config.mjs), and
[app/services/store.ts](app/services/store.ts).

Problem: the first markers cannot appear until the app has booted and the stations request has
answered. Nothing from the previous session is reused.

Two candidate approaches, cheapest first:

- **Workbox `StaleWhileRevalidate` for `^https://winds\.mobi/api/2\.3/stations`.** Zero app
  code: the SW answers from Cache Storage immediately and refreshes in the background, and the
  2-minute auto-refresh ([app/services/map-refresh.ts](app/services/map-refresh.ts)) picks the
  fresh copy up on its next tick. Cache-hit rate should be high because
  `roundBoundsForRequest` ([app/utils/map-view.ts](app/utils/map-view.ts)) snaps bounds to a
  grid, so reloading the same view produces a byte-identical URL. Set a short
  `expiration.maxAgeSeconds` and a bounded `maxEntries`.
- **`DocumentStorage` from `@warp-drive/experiments/document-storage`** — an OPFS-backed,
  `BroadcastChannel`-synced persistence layer built for WarpDrive's cache and request documents,
  so the store rehydrates its documents on boot rather than replaying HTTP. It is an
  **experimental** package that isn't installed; treat adopting it as the addon-vetting exercise
  CLAUDE.md describes — install, exercise the real API in a throwaway component, and confirm
  `pnpm build` (production, not just dev) succeeds before committing either way.

**Safety gate — do this in the same commit, not "later":** these readings are what pilots
decide to fly on. Serving a cached station list with no visible marker that it is stale is a
real hazard, not a cosmetic gap. Whichever approach is taken, ship it together with a staleness
indicator driven off `station.last.timestamp` (the `time-ago` helper already renders exactly
this wording) and, ideally, a dimmed/greyed marker treatment past some age threshold. Do not
land this without it.

### Preconnect to the tile hosts

Where it lives: [index.html](index.html) `<head>`.

Problem: `tile.osm.ch` and `s3.amazonaws.com` ([app/utils/map-style.ts](app/utils/map-style.ts))
are only discovered once MapLibre has booted and started requesting tiles, so the first tile
pays a full DNS + TLS handshake then.

Proposed fix: add `<link rel="preconnect">` for both hosts (and, cheaply,
`https://v2-winds-mobi.b-cdn.net`). Two lines, no behaviour change. The tiles themselves are
already `CacheFirst`-cached for a year, so this only affects the first visit.
