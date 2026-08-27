# TODO

## Wind threshold alarm (issue #161) — Phase 2: alerts while the app is fully closed

Phase 1 (the whole client-side feature — compass-rose picker, evaluation engine, sound/glow/
marker-ring signals, the Alarms view) shipped as a beta feature on `mb/wind-threshold-alarm`.

The issue also asks for background checking "even when the app is not running" as an
installed PWA. This is a materially different problem from Phase 1 — no client-side code runs
at all once the app/tab is fully closed, so this cannot be an incremental extension of the
Phase 1 work:

- **No reliable client-only mechanism exists.** The Periodic Background Sync API is the only
  candidate and it's Chromium-only, has no guaranteed interval (throttled by an internal
  site-engagement heuristic, often hours apart), and has zero support on iOS/Safari — a large
  fraction of actual pilots. It can't be the real mechanism here, only a best-effort extra.
- **Needs server-side evaluation + Web Push**, which means:
  - Somewhere to persist alarm configs server-side, since a closed client can't read its own
    localStorage. This app's alarms (and favorites) are deliberately local-only/no-account
    today — extending that needs either reviving the currently-disabled login (`TODO: Remove
login` in the session/auth code) or a login-free device-registration model (push
    subscription + config keyed by a device id). Decide which fits the product's existing
    no-account stance before starting.
  - `winds-mobi-providers` (the only writer of new readings, already scheduler-driven) is the
    natural place to add a per-station threshold-check pass after each new reading lands —
    cross-repo work with its own CI/versioning, per the workspace `CLAUDE.md`'s
    working-across-repos guidance.
  - Web Push infrastructure: VAPID keys, a subscription-storage endpoint (`winds-mobi-api` or
    a small new service), and this app's service worker gaining a real `push` handler — today
    it's Workbox's default `generateSW` strategy with no custom SW code at all (confirmed: no
    `PushManager`/`Notification`/push-event code anywhere in the repo); a handler needs the
    `injectManifest` strategy instead.
- **Recommendation:** scope Phase 2 as its own cross-repo initiative once Phase 1 has real
  usage — it's larger than the rest of this feature combined and touches the account/sync
  model, not just this app.

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

## Startup performance audit (2026-07-26)

Goal: get pixels on screen as fast as possible, and re-use last session's data instead of
blocking on the network. Each numbered item below is one focused commit; work them in
order (they are sorted by measured value per unit of risk) and delete each item as it
lands. Items marked **spike** need a throwaway prototype before committing to the change.

### Measured baseline

Taken from a production build (`vite build --sourcemap`, output attributed per package by
decoding the sourcemap mappings) plus live headers from `https://winds.mobi` and
`https://v2-winds-mobi.b-cdn.net` on 2026-07-26. Re-measure after each item lands.

- `assets/main-*.js` — **2262 kB raw / 605 kB gzip / 483 kB brotli**, a single chunk.
  Composition of the raw bytes: `maplibre-gl` **1017 kB (45 %)**, `ember-source` 322 kB
  (14 %), our own `app/` 145 kB (6 %), `@warp-drive/*` ~190 kB (8 %), `ember-phosphor-icons`
  87 kB, `tailwind-merge` 41 kB, `marked` 40 kB, `@frontile/*` ~110 kB.
- `assets/main-*.css` — 174 kB raw / 27 kB gzip.
- Highcharts is already off the critical path in three dynamic chunks (`highcharts` 280 kB,
  `stock` 114 kB, `highcharts-more` 100 kB) — see the Highcharts section in CLAUDE.md.
- The stations API (`/api/2.3/stations/?…limit=470…`) answers in **~190 ms TTFB, 104 kB**,
  same origin as the HTML, **uncompressed** (no `content-encoding` even when offered).
- CDN assets (`v2-winds-mobi.b-cdn.net`): `cache-control: public, max-age=2592000`,
  `content-encoding: zstd`, `access-control-allow-origin: *`. Already good.
- Origin (`winds.mobi`, Caddy): **no `cache-control` and no compression at all** on
  `index.html`, `sw.js`, or the `assets/*` copies it also serves.

### 1. Caddy serves the origin uncompressed and without cache headers

Where it lives: not this repo — `winds.mobi`'s Caddyfile in
`https://github.com/winds-mobi/winds-mobi-config`. Recorded here because it is on this
app's critical path and was measured as part of this audit.

Problem: `https://winds.mobi/` returns `index.html` with no `cache-control` and no
`content-encoding` (1825 bytes raw, ~540 bytes brotli), and `sw.js` likewise. The stations
API responses (~104 kB of JSON) are also uncompressed.

Proposed fix: enable Caddy's `encode zstd gzip` for `text/html`, `application/javascript`
and `application/json`, and set explicit `cache-control` — `no-cache` for `index.html` and
`sw.js` (they must revalidate so a deploy is picked up; the SW's `NavigationRoute` already
serves the HTML from cache so this costs nothing at runtime). Roughly 100 kB → ~20 kB per
stations request, on the path that blocks the first markers appearing.

### 2. Defer `maplibre-gl` behind a dynamic import (spike)

Where it lives: [app/components/map/index.gts](app/components/map/index.gts) — static
`import MapLibreGL from 'ember-maplibre-gl/components/maplibre-gl'` and
`import { NavigationControl, TerrainControl } from 'maplibre-gl'`.

Problem: `maplibre-gl` is 45 % of the main chunk (1017 kB raw / ~274 kB gzip) and is
statically imported, so it is parsed and evaluated before Ember boots — including on
`/settings`, `/help`, `/favorites` and `/nearby`, which never render a map. Splitting it
into its own chunk via `manualChunks` would NOT help; only a dynamic `import()` defers it.

Proposed fix: load the MapLibre component and its controls through an ember-concurrency
task doing `await import(…)`, rendering a skeleton (or the existing map chrome) until it
resolves. Expected: main chunk ~2262 kB → ~1250 kB raw (605 kB → ~350 kB gzip), so the
navbar and station panel paint roughly twice as early on parse-bound phones.
Spike first, because: the two control classes are instantiated as field initializers today
and would have to move into the async path; `ember-maplibre-gl`'s own component graph may
pull `maplibre-gl` back in statically; and the acceptance tests that already fight
MapLibre's `idle` event in this container (see CLAUDE.md) are the ones most likely to break.
Confirm the split actually happens by re-running the sourcemap attribution before committing.

### 3. Show last session's data instantly instead of waiting for the network (spike)

Where it lives: the `runtimeCaching` block in [vite.config.mjs](vite.config.mjs), and
[app/services/store.ts](app/services/store.ts).

Problem: today the first markers cannot appear until a full serial chain completes — JS
parse → MapLibre init → style/WebGL → the `idle` event → `captureBounds` → the stations
request (~190 ms TTFB, 104 kB uncompressed). Nothing from the previous session is reused.

Two candidate approaches, cheapest first:

- **Workbox `StaleWhileRevalidate` for `^https://winds\.mobi/api/2\.3/stations`.** Zero app
  code: the SW answers from Cache Storage immediately and refreshes in the background, and
  the existing 2-minute auto-refresh ([app/services/map-refresh.ts](app/services/map-refresh.ts))
  picks the fresh copy up on its next tick. Cache-hit rate should be high because
  `roundBoundsForRequest` ([app/utils/map-view.ts](app/utils/map-view.ts)) snaps bounds to a
  grid, so reloading the same view produces a byte-identical URL. Set a short
  `expiration.maxAgeSeconds` and a bounded `maxEntries`.
- **`DocumentStorage` from `@warp-drive/experiments/document-storage`** (already a
  dependency, currently unused) — an OPFS-backed, `BroadcastChannel`-synced persistence
  layer built specifically for WarpDrive's cache and request documents, so the store
  rehydrates its documents on boot rather than replaying HTTP. More faithful to what was
  asked ("WarpDrive re-uses the cached data from last time") but it is an **experimental**
  package; treat adopting it as the addon-vetting exercise CLAUDE.md describes — install,
  exercise the real API in a throwaway component, and confirm `pnpm build` (production, not
  just dev) succeeds before committing either way.

**Safety gate — do this in the same commit, not "later":** these readings are what pilots
decide to fly on. Serving a cached station list with no visible marker that it is stale is a
real hazard, not a cosmetic gap. Whichever approach is taken, ship it together with a
staleness indicator driven off `station.last.timestamp` (the `time-ago` helper already
renders exactly this wording) and, ideally, a dimmed/greyed marker treatment past some age
threshold. Do not land this item without it.

### 4. Preconnect to the tile hosts

Where it lives: [index.html](index.html) `<head>`.

Problem: `tile.osm.ch` and `s3.amazonaws.com` ([app/utils/map-style.ts](app/utils/map-style.ts))
are only discovered once MapLibre has booted and started requesting tiles — a second or more
into startup — so the first tile pays a full DNS + TLS handshake then.

Proposed fix: add `<link rel="preconnect">` for both hosts (and, cheaply,
`https://v2-winds-mobi.b-cdn.net`). Two lines, no behaviour change. Note the tiles
themselves are already `CacheFirst`-cached for a year, so this only affects the first visit.

### 5. Deep links are broken for first-time visitors

Where it lives: not this repo — `winds.mobi`'s Caddyfile in
`https://github.com/winds-mobi/winds-mobi-config`.

Problem: Caddy does not do an SPA fallback. It **301-redirects every unknown path to `/`**,
discarding the route:

```
GET https://winds.mobi/map/1234  ->  301, location: /
GET https://winds.mobi/help      ->  301, location: /
GET https://winds.mobi/nearby    ->  301, location: /
```

A proper SPA fallback serves `index.html` with a **200 at the original URL** so the Ember
router can read the path. This means a shared station link, or any deep link opened in a
fresh browser, lands the user on the map root instead of the station they were sent to.

Why it isn't visible day to day: the service worker's `navigateFallback: '/index.html'`
([vite.config.mjs](vite.config.mjs)) handles navigations from the precache once the SW is
installed, so returning visitors are fine. It breaks exactly for the people least likely to
report it — first-time visitors and anyone opening a shared link cold.

This is what `public/_redirects` was originally for (commit `ec89ffb`, "fix: Netlify
redirects"); it stopped doing anything when hosting moved to Caddy + Bunny, and the
replacement was never wired up.

Proposed fix: in the Caddyfile, replace the catch-all redirect with a real fallback —
`try_files {path} /index.html` and serve it 200 — while keeping the existing
`/api`, `/user`, `/admin` and `/django-static` backends ahead of it (the same paths already
listed in `navigateFallbackDenylist`). Pairs naturally with item 1, which touches the same
config. Verify with `curl -sI https://winds.mobi/map/1234` returning 200, and by opening a
station deep link in a private window with no service worker registered.
