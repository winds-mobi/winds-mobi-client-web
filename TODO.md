# TODO

## Station panel → Frontile `<Drawer>` (issue #163)

Context: the routed station panel (`app/components/station/index.gts`) was moved from a
hand-rolled `<section>` to Frontile's `<Drawer>`, on the theory (issue #163's own note-to-self)
that it duplicates Drawer's lifecycle behavior by hand, worse. `@placement` is driven by a
hand-rolled `app/modifiers/track-media-query.ts` (`ember-responsive` was evaluated and
**rejected** — breaks `pnpm build`, see CLAUDE.md's addon-first section) matching the same
`(orientation: landscape), (min-width: 768px)` condition the overlay slot's own Tailwind classes
already use.

- **Fixed: desktop panel slid in from the middle instead of from off-screen-left.** `@placement`
  doesn't just pick which CSS edge classes apply (that part really is cosmetically absorbed by
  the slot's own sizing) — it _also_ independently selects Drawer's enter-transition direction
  (`slide-from-${placement}`), and each direction is a `transform: translateX/Y(±100%)`
  **relative to the element's own box**, not the viewport. The panel's resting box sits at the
  _left_ edge of the screen, but was set to `@placement="right"` (`slideFromRight`, starting at
  `translateX(+100%)` — 100% of its own ~32rem width to the _right_ of its resting spot, i.e.
  roughly mid-screen on desktop). Fixed by using `@placement="left"` for the side-panel case
  (`bottom` stays correct for the mobile sheet, verified visually not to have the same bug).

- **Fixed (found while rebuilding this on the Frontile v0.18 bump): `aria-labelledby` silently
  stopped resolving.** v0.18's `Drawer` changed `aria-labelledby` from an unconditional
  `this.headerId` to `this.labelledById`, which only returns the id once a real `drawer.Header`
  has rendered and self-registered (`registerSelf`/`hasHeader`, tracked via a render count — see
  `drawer.gts`'s own extensive comment on why a `ref` couldn't do this instead). Our panel
  deliberately avoided `drawer.Header` (to dodge the now-fixed Glint type gap, see the Frontile
  bump section below) and instead put `id={{d.headerId}}` directly on our own `<h2>` — which still
  carries the id, but nothing points `aria-labelledby` at it anymore, so the dialog silently loses
  its accessible name. Fixed by wrapping the existing title+close-button row in `<d.Header
@class="...">` instead of a plain `<div>` (its own default classes replaced via `@class`, merged
  through `DrawerHeader`'s internal `twMerge`) — this is now safe to do since the Glint gap that
  originally ruled it out is gone. `StationHeader`'s `@headerId` passthrough arg was reverted along
  with it (the id now lives on `drawer.Header`'s own wrapping element, not the inner `<h2>`).

- **Fixed (found the same way): a stray rounded corner and a border on all four sides.**
  v0.18's `theme/components/overlays.ts` gave `Drawer`'s base slot a `rounded-2xl` and an
  all-sides `border border-surface-overlay-mild` — v0.17.1's base had neither. Visible directly:
  a rounded top corner where the panel should be flush against the map, and (confirmed by
  zooming into a screenshot) a thin border along every edge instead of just the one edge that
  actually separates the panel from the map. `panelClasses.base` (`station/index.gts`) now
  explicitly resets `rounded-none!` and states every side's border width individually
  (`border-t! border-r-0! border-b-0! border-l-0!`, mirrored per breakpoint) rather than a bare
  `border-t`/`border-r` that relies on the _other_ three sides staying unset — a partial override
  left v0.18's own border showing through on whichever sides it didn't touch.

- **Open: a mobile-only "push, then correct, then jump back" artifact when the panel opens**,
  reported live after the desktop fix landed. Investigation so far (no fix applied yet):
  - **Ruled out: the map camera/padding system (`drive-map-camera.ts`/`map-padding.ts`).**
    `applyMapPadding` uses `map.jumpTo(...)` — an instant, non-animated snap, not an eased
    `flyTo` (that only fires when the routed lat/lng/zoom actually changes, which a plain
    marker-click open/close never does). Verified empirically: sampled a station marker's
    on-screen position (the same technique the #61/#155 regression tests use) every animation
    frame across a full mobile open transition — completely flat, zero movement, the whole time.
    The padding math is a rigid translation specifically designed to cancel itself out (see the
    comment in `map-padding.ts`), and it does.
  - **Ruled out (at least the "stale default" variant): `@placement` flipping mid-open.**
    Considered because `isSidePanel` starts at its `@tracked` field initializer (`false`) before
    `track-media-query`'s modifier runs its setup and calls back with the real value — a
    plausible one-frame "wrong value" race. Sampled `data-test-station-panel-placement` every
    frame across the same mobile transition: stayed `"bottom"` for all 48 samples, never flipped.
    Not fully closed: the test's `stubMatchMedia` helper returns a fixed value with a no-op
    listener, so it can't simulate a genuine `matchMedia` `'change'` event firing mid-transition
    (e.g. from a real mobile browser's address-bar hide/show altering viewport dimensions) — but
    structurally this is a weak candidate anyway, since the bottom sheet is `position: absolute`
    and never changes the document's own height/scroll extent (the entire point of the #61/#155
    overlay design), so there's no obvious mechanism for opening it to trigger a viewport change.
  - **Best-evidenced lead, not yet fixed: Drawer's un-forwarded `preventAutoFocus`.**
    `Overlay.gts`'s `setupContent` modifier does `later(() => { ...; el.focus(); },
transitionDuration)` whenever `disableFocusTrap === true` and `preventAutoFocus` isn't
    `true` — exactly our config (`@disableFocusTrap={{true}}`, no way to also pass
    `preventAutoFocus`, since `DrawerArgs` doesn't include it in its `Pick<OverlaySignature['Args'],
...>` list — this is precisely the gap the Frontile maintainer flagged in their own comment on
    [frontile#447](https://github.com/josemarluedke/frontile/issues/447): "the overlay still calls
    `.focus()` on itself once when it opens... `preventAutoFocus` isn't forwarded by `<Drawer>`
    yet"). Confirmed directly (not just theoretically): sampling `document.activeElement` every
    frame shows it moving from `<body>` to a real DOM element within ~1-2 frames of mount (in the
    test env; production would delay this to the real `transitionDuration`, ~200ms, since
    `isAnimationEnabled` — and so the local `transitionDuration` used by this specific `later()`
    call — is forced to 0 during tests via `macroCondition(isTesting())`). In production this
    `.focus()` call on a large `tabindex="0"` bottom-anchored div would land right as the slide-in
    animation finishes — a very plausible trigger for a mobile browser's scroll-into-view/viewport
    behavior, matching the reported timing. **Still true on `frontile@0.18.0-alpha.17`**, checked
    directly against the actual `Overlay`/`Drawer` source on `main` after the v0.18 bump (see the
    Frontile bump section below) — `preventAutoFocus` still isn't in `DrawerArgs`' `Pick<...>` list,
    and `setupContent`'s auto-focus logic is byte-for-byte the same. Not fixed by the bump.
  - **Dead end worth recording: acceptance tests cannot observe the slide animation at all.**
    `Overlay.gts`'s `isAnimationEnabled` getter unconditionally returns `false` under
    `macroCondition(isTesting())`, regardless of `@disableTransitions`. A `requestAnimationFrame`-
    sampling diagnostic test can still catch non-CSS side effects (marker position, active
    element, attribute values) but can never reproduce the animation itself — confirming or
    denying a purely visual/compositing glitch needs a real browser (the Claude-in-Chrome
    extension wasn't connected this session) or a physical device.
  - **Proposed fixes, not yet decided between:**
    1. Drop `<Drawer>` down to Frontile's lower-level `<Overlay>` directly (which does support
       `@preventAutoFocus`), reimplementing Drawer's placement/size classes ourselves (a handful
       of Tailwind classes, already known from reading `@frontile/theme`'s `overlays.ts`) — stays
       within Frontile's supported API, no patching.
    2. Accept the auto-focus for now and file/comment upstream on frontile#447 asking for
       `preventAutoFocus` forwarding; revisit once fixed upstream.
    3. Set `@disableFocusTrap={{false}}` (enable the real focus trap) so the whole `if` branch
       guarding `el.focus()` never runs. Traps Tab-key keyboard focus inside the panel while
       open — a real UX tradeoff (the map/rest of the page stays mouse/touch-interactive either
       way; only Tab-reachability changes), not just a workaround.
       Per this repo's "don't patch around a library's own behavior" convention, monkey-patching
       `.focus()`/`Element.prototype` from our own code was explicitly ruled out rather than
       attempted.

## Dependency bumps (branch `mb/deps-update`)

- **`maplibre-gl` 5.20.2 → 6.1.0 / `ember-maplibre-gl` 0.6.2 → 0.7.0 — landed, fully resolved.**
  Originally landed with the dev container unable to run any MapLibre-dependent test for real (no
  WebGL — see the Dockerfile history), which produced 26 acceptance failures with `TypeError:
Cannot read properties of undefined (reading 'destroy')` from `ember-maplibre-gl`'s teardown
  code — confirmed caused by tearing down a Map instance that never finished initializing, not a
  real incompatibility, and gone once the container got real software WebGL (Debian + Mesa, see
  the Dockerfile). That also exposed the v6 bump's own real bug: `maplibre-gl` v6 is ESM-only and
  resolves its worker file at runtime via `import.meta.url`, which only works unbundled — under
  Vite the worker 404s and the map never renders tiles. Fixed with a one-time `setWorkerUrl()`
  call in `app/components/map/index.gts` (Vite's `?url` import resolves the real built/dev-served
  path); verified via a production build producing a real `dist/assets/maplibre-gl-worker-*.mjs`
  chunk.
  With WebGL and the worker both fixed, 3 test failures remained — all in tests gated by
  `test.if(..., webGLAvailable, ...)` that had literally never executed before (always skipped).
  All 3 are now root-caused and fixed, and none were regressions from this bump:
  - `Acceptance | map query params: it resets to the default view when the logo is clicked` — the
    test's own expectation was wrong, not the app: Ember's router omits a query param from the URL
    entirely when its value equals the controller's declared default, so the post-reset URL is
    bare `/map`, not one spelling out the defaults explicitly. Fixed the assertion.
  - `Acceptance | map station panel: the map marker element itself gets the pointer cursor, not
just its inner content` and `...the selected-station ring lives on the map marker element and
follows selection` — pure test-timing gap: `<map.marker>` adds its element to the map
    asynchronously, and `await visit(...)` resolving doesn't mean the marker DOM exists yet (never
    exercised before, since these tests always used to be skipped). Confirmed via reading v6's own
    bundled `Marker` source that its `className`/`maplibregl-marker` handling is unchanged from
    what these tests were written against. Fixed with a `waitForMarker(stationId)` test helper.
  - A 4th, intermittent (~1-in-3-4 runs) failure surfaced during verification, unrelated to the
    bump itself: `Acceptance | map station panel: it auto refreshes map and station requests
after the refresh interval` occasionally hit `TypeError: Cannot read properties of undefined
(reading 'responsive')` inside Highcharts internals. Root cause: `app/modifiers/
render-highcharts.ts`'s async `sync()` could resume and call `updateChart()` on an
    already-destroyed chart if the modifier was torn down mid-flight (e.g. panel closing during a
    fast background refresh) — a real, pre-existing race, just never stressed until these tests
    ran for real. Fixed by also bailing on `isDestroying(this)` in the existing stale-call guard.
    Verified: 5 consecutive full `pnpm test:ember:dev` runs, 250/250 pass, 0 skip, 0 fail; `pnpm
lint` clean (css, js, format, hbs, types).

## Ember 7 upgrade (branch `mb/ember-7-upgrade`)

- **Landed**: `ember-source`/`ember-cli` 6.3.x → 7.1.0, the whole `@embroider/*` family to their
  latest mutually-compatible versions, and `@warp-drive/*`/`@ember-data/*` 5.8.0 → 5.8.2 (that
  WarpDrive patch exists specifically to "ensure support for Ember v7" per its own release notes).
  Also swapped `tsconfig.json`'s base from the community `@tsconfig/ember` to the official
  `@ember/app-tsconfig` successor, matching the current `@ember/app-blueprint` template.
- **Root-caused and fixed the template-compiler crash directly — no dependency patch needed.**
  `ember-source@7` removed the flat `dist/ember-template-compiler.js` file (the compiler now lives
  behind package `exports` at `ember-source/ember-template-compiler/index.js`). The actual bug was
  in **our own** `babel.config.cjs`, which hardcoded `compilerPath:
'ember-source/dist/ember-template-compiler.js'` — that stale string, not anything upstream, is what
  crashed both `pnpm start` and `pnpm build`. A lot of the investigation time went into wrongly
  suspecting Embroider's own `ember-source` v1-compat-adapter before finding this. Fixed by computing
  the path correctly instead of hardcoding it:
  `compilerPath: require.resolve('ember-source/ember-template-compiler/index.js')`.
- **Separately, `babel-plugin-ember-template-compilation@3.x+` broke ESLint.** That package rewrote
  its compiler resolution to be async (`await import(...)`) instead of the old synchronous
  `require()`, which `@babel/eslint-parser`'s synchronous `parseSync` can't call at all ("you appear
  to be using an async plugin/preset, but Babel has been called synchronously") — a known, still-open
  upstream issue: https://github.com/emberjs/babel-plugin-ember-template-compilation/issues/101. Fixed
  the same way the official `@ember/app-blueprint` did: switched `eslint.config.mjs` to
  `@babel/eslint-parser/experimental-worker`, which runs Babel in a worker thread and bridges it back
  to ESLint's sync API. With that in place, `babel-plugin-ember-template-compilation` stayed on the
  blessed `^4.0.0`.
- **Two remaining `lint:types` errors are a genuine, unfixed `@frontile/overlays@0.17.1` /
  ember-source-7 type gap**, not a bug in our code: `Popover`/`Drawer`'s yielded block params
  (`popover.anchor`, `drawer.Header`, etc.) are typed via `@glint/template`'s `ModifierLike`, which no
  longer structurally matches ember-source 7's `InvokableInstance`/`[Invoke]` shape. Tried bumping
  `@glint/ember-tsc`/`@glint/template` and `ember-modifier` in several combinations — every one made
  it worse (more cascading errors elsewhere), not better, and Frontile has no newer stable release
  (`0.18.0` is alpha-only) to pick up a fix from. Suppressed with two scoped, commented
  `{{! @glint-expect-error: ... }}` directives in `app/components/navbar/menu/mobile.gts` and
  `app/components/navbar/search.gts` — Glint will itself error if either directive stops matching a
  real error, so remove them the moment a Frontile release actually fixes this.
- **Not in scope, flagged for a future bump**: the current `@ember/app-blueprint` template also
  pins `vite` `^8.1.0` (we're on `^6.0.0`, two majors behind), `typescript` `^6.0.3` (on `^5.9.3`),
  `stylelint` `^17.14.0` (on `^16.16.0`), and `eslint-config-prettier` `^10.1.8` (on `^9.1.0`) — each
  a real major bump with its own risk/testing surface, deliberately not bundled into the Ember bump
  itself.

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

### 1. The service worker precaches the wrong origin — ✅ done

Where it lives: [vite.config.mjs](vite.config.mjs) — `base: process.env.CDN_URL || '/'`
for Vite, but `VitePWA({ base: '/' })` hardcoded; CDN_URL is set to
`https://v2-winds-mobi.b-cdn.net/` by
[.github/workflows/build-deploy-production.yml](.github/workflows/build-deploy-production.yml).

Problem: the two `base` values disagree, so the built `sw.js` precaches
`https://winds.mobi/assets/main-*.js` while the page actually loads
`https://v2-winds-mobi.b-cdn.net/assets/main-*.js`. Verified against production: the live
`sw.js` precache list is all root-relative (`assets/main-B1MYm70R.js`, …) and
`https://winds.mobi/assets/main-B1MYm70R.js` returns the same file (rsync deploys `dist/`
to Caddy too). Consequences, both real:

- Every first visit downloaded the app **twice** — ~605 kB zstd from the CDN to boot, plus a
  background precache of **2.9 MB uncompressed** from Caddy (which sends no
  `content-encoding`), competing for bandwidth exactly during startup. On mobile this was
  the single most expensive thing the app did.
- Repeat visits got **no** service-worker benefit for JS/CSS — the CDN responses were in no
  Workbox cache, so the app was only as fast as the HTTP cache allowed and wasn't
  offline-capable.

**The naive fix — `VitePWA({ base: process.env.CDN_URL || '/' })`, as originally proposed
here — is wrong and was tested to confirm it: it doesn't just fix the precache, it also
moves the service worker's own registration URL and scope to the CDN, and a service worker
can only be registered from the same origin as the document registering it.** Built with
that change and confirmed the browser-facing breakage directly: `registerSW.js` came out
calling `navigator.serviceWorker.register('https://v2-winds-mobi.b-cdn.net/sw.js', { scope:
'https://v2-winds-mobi.b-cdn.net/' })`, which browsers reject outright. `base: '/'` here is
not an oversight — it's PR #107 (`bb9c92c`), a deliberate prior fix by Yann Savary for
exactly this failure mode; its own PR body shows the `manifest.webmanifest`/`registerSW.js`
tags staying root-relative as the point of the change. That fix is correct and still
needed; it just left the precache-manifest mismatch (this item) unaddressed, since Workbox
derives the precache manifest's URL prefix from the same `base` value.

**Actual fix:** kept `base: '/'` for `VitePWA`'s own artifacts, and added Workbox's
`modifyURLPrefix` — a `generateSW` option that rewrites only the precache manifest's own
URLs, independent of the `base` used for the SW's registration/scope/manifest tags — scoped
to exactly the two prefixes the real page actually fetches from the CDN in production
(`assets/` and `@embroider/virtual/`; verified against a real prod `index.html`, not
assumed). Applied only when `CDN_URL` is set, so a local/CDN-less `pnpm build` is unaffected.

Verified with real builds, both with and without `CDN_URL` set:

- With `CDN_URL`: `registerSW.js`/`manifest.webmanifest`/`index.html`'s manifest and
  registerSW `<link>`/`<script>` tags all stayed root-relative; the precache list's
  `assets/*` and `@embroider/virtual/*` entries became CDN-absolute; `index.html`,
  `registerSW.js`, `manifest.webmanifest`, and the icon files stayed root-relative (correct
  — those are genuinely Caddy-served, not on the CDN).
- Without `CDN_URL`: precache list is entirely root-relative, unchanged from before this fix
  — no regression for a CDN-less build.

Bunny already sends `access-control-allow-origin: *` on CDN assets, so Workbox's
cross-origin precache fetches get a real (non-opaque) response it can verify and cache
normally — no CORS obstacle.

This also answers "cache everything for a week without even a freshness request":
precached entries are served straight from Cache Storage with no network round-trip at all.

**To see the pre-fix bug live in DevTools:** unregistering the service worker does not
clear its Cache Storage, so a browser that has ever visited `winds.mobi` before will often
show no live duplicate request on reload — Workbox checks Cache Storage first and skips
re-fetching a precache entry it already has. Two ways to actually see it: (1) Application →
Storage → Cache Storage → `workbox-precache-*` → look for `https://winds.mobi/assets/main-*`
sitting there unread (the page always loads the CDN copy) — the duplicate is present even
with no live request; or (2) Application → Storage → **"Clear site data"** (not just
unregister), then reload with the Network panel filtered to `main` — this forces a true
cache miss and shows both the CDN and Caddy requests firing live, one for each origin.

Considered and explicitly deferred (not done as part of this fix): putting Bunny in front
of `winds.mobi` itself (a custom hostname/CNAME) so there's no separate CDN origin at all,
which would eliminate this entire class of base-mismatch bug rather than patching around
it. Real option — the team controls DNS, Bunny, and Caddy — but it's a bigger cross-repo,
cross-dashboard change with real tradeoffs (Bunny becomes load-bearing for the whole site,
not just static assets; needs edge-rule work to keep `/api`, `/admin`, `/user`,
`/django-static` bypassing cache correctly) that needs its own discussion, not something to
fold into an app-level bug fix.

### 2. First render is blocked on a GPS fix — ✅ done

Where it lived: [app/routes/application.ts](app/routes/application.ts) —
`await this.nearbyLocation.syncPermissionState()` in `beforeModel`, and
[app/services/nearby-location.ts](app/services/nearby-location.ts), whose
`syncPermissionState` ends with `await this.requestCurrentPosition()` when the permission
is already `granted`.

Problem: Ember renders nothing until the application route's `beforeModel` resolves. For
any returning user who granted location, that means the whole app waits on
`navigator.geolocation.getCurrentPosition` with
`{ enableHighAccuracy: true, timeout: 15_000 }` ([app/utils/location.ts](app/utils/location.ts)) —
instant when the 5-minute `maximumAge` cache hits, but seconds to a 15 s timeout on a cold
mobile GPS fix. Nothing needs the result synchronously: every consumer
([navbar/locate-control.gts](app/components/navbar/locate-control.gts),
[navbar/search.gts](app/components/navbar/search.gts),
[navbar/search-result.gts](app/components/navbar/search-result.gts)) already derives from
the service's tracked state, and `isCheckingPermission` already exists to express
"not known yet".

Fix: dropped the `await` (`void this.nearbyLocation.syncPermissionState();`). No other
change needed — `syncPermissionState`'s own re-entrancy guard (the synchronous
`this.permissionState = 'syncing'` transition before its first `await`) lives entirely
inside the service method itself, so it still runs exactly once regardless of whether the
caller awaits it, and the existing `isCheckingPermission`/tracked-state consumers already
render the "not known yet" state correctly with no changes on their end.

Verified: `pnpm lint` clean; full `pnpm test:ember:dev` suite (217 passed, 8 skipped —
the WebGL-dependent tests, unrelated) including `navbar/locate-control`'s pending/disabled
integration tests and every `nearby-route` acceptance test, none of which needed changes.

### 3. Caddy serves the origin uncompressed and without cache headers

Where it lives: not this repo — `winds.mobi`'s Caddyfile in
`https://github.com/winds-mobi/winds-mobi-config`. Recorded here because it is on this
app's critical path and was measured as part of this audit.

Problem: `https://winds.mobi/` returns `index.html` with no `cache-control` and no
`content-encoding` (1825 bytes raw, ~540 bytes brotli), and `sw.js` likewise. The stations
API responses (~104 kB of JSON) are also uncompressed. After item 1 lands the origin only
serves the HTML shell, the SW and the API — but those are exactly what gates first paint
and first data.

Proposed fix: enable Caddy's `encode zstd gzip` for `text/html`, `application/javascript`
and `application/json`, and set explicit `cache-control` — `no-cache` for `index.html` and
`sw.js` (they must revalidate so a deploy is picked up; the SW's `NavigationRoute` already
serves the HTML from cache so this costs nothing at runtime). Roughly 100 kB → ~20 kB per
stations request, on the path that blocks the first markers appearing.

### 4. Defer `maplibre-gl` behind a dynamic import (spike)

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

### 5. Show last session's data instantly instead of waiting for the network (spike)

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
threshold. Do not land item 5 without it.

### 6. Keep `marked` off the critical path — ✅ done, superseded by dropping it entirely

Landed, in two steps on the same branch: the first commit deferred `marked` behind a
dynamic `import()`, as originally proposed below. The second commit went further and
**removed `marked` as a dependency altogether** — instead of rendering `CHANGELOG.md`
in-app, the help page now links to GitHub's own rendering of `CHANGELOG.md`, pinned to
the exact git tag a build shipped (`app/utils/changelog-link.ts`, fed by a new
`config.version` stamped from `APP_VERSION` in
[.github/workflows/build-deploy-production.yml](.github/workflows/build-deploy-production.yml)),
and shows that version number directly so a visitor can report it against a bug. Verified
that `marked` no longer appears in the production bundle at all (not even as its own
chunk); `@tailwindcss/typography` (only ever used for the markdown render's `prose`
classes) was removed too, dropping the CSS bundle 174 kB → 158 kB raw.

The `@tracked isLoading` manual-loading-flag issue flagged below is moot — the rewritten
component is a plain presentational one with no fetch, no task, no loading state at all.

Original proposal, kept for context: `await import('marked')` inside the component's
existing load path, so the parser is fetched alongside the Markdown it parses. A broader
alternative was also considered — adopting `@embroider/router`'s `splitAtRoutes` so
`help`/`settings`/`favorites` become route chunks — and rejected as a bigger change with a
smaller payoff, since `map` is the default route and carries almost all the weight. See the
"Assessed" entry below for what checking that alternative actually turned up.

### 7. Preconnect to the tile hosts

Where it lives: [index.html](index.html) `<head>`.

Problem: `tile.osm.ch` and `s3.amazonaws.com` ([app/utils/map-style.ts](app/utils/map-style.ts))
are only discovered once MapLibre has booted and started requesting tiles — a second or more
into startup — so the first tile pays a full DNS + TLS handshake then.

Proposed fix: add `<link rel="preconnect">` for both hosts (and, cheaply,
`https://v2-winds-mobi.b-cdn.net`). Two lines, no behaviour change. Note the tiles
themselves are already `CacheFirst`-cached for a year, so this only affects the first visit.

### 8. Deploy-payload cleanups — DONE, but it uncovered item 9

Landed: `.DS_Store` added to [.gitignore](.gitignore), and the dead `public/_redirects`
removed.

Two claims in the original write-up of this item were wrong; correcting them here so the
measurements above stay trustworthy:

- The `.DS_Store` files are **not** committed and **not** shipped. They are untracked
  (ignored via a global `core.excludesFile`, never in this repo's history), so a CI
  `actions/checkout` never sees them and they cannot reach the CDN — `winds.mobi/.DS_Store`
  and the CDN equivalent both answer 301, not 200. The `.gitignore` entry was still worth
  adding, but purely defensively, for contributors without a global ignore. There was no
  payload to shrink.
- `_redirects` was dead as claimed, but the reasoning "the SPA fallback is handled by Caddy"
  was not verified and is **false** — see item 9.

### 9. Deep links are broken for first-time visitors (found while doing item 8)

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
report it — first-time visitors and anyone opening a shared link cold. Note also that item 1
is a prerequisite for the SW half of this working reliably at all.

This is what `public/_redirects` was originally for (commit `ec89ffb`, "fix: Netlify
redirects"); it stopped doing anything when hosting moved to Caddy + Bunny, and the
replacement was never wired up.

Proposed fix: in the Caddyfile, replace the catch-all redirect with a real fallback —
`try_files {path} /index.html` and serve it 200 — while keeping the existing
`/api`, `/user`, `/admin` and `/django-static` backends ahead of it (the same paths already
listed in `navigateFallbackDenylist`). Pairs naturally with item 3, which touches the same
config. Verify with `curl -sI https://winds.mobi/map/1234` returning 200, and by opening a
station deep link in a private window with no service worker registered.

### Assessed — no change needed

- **WarpDrive's debug/deprecation code is already stripped in production.**
  [ember-cli-build.mjs](ember-cli-build.mjs) does call `setConfig(app, …, { compatWith: '4.12' })`,
  and the production bundle contains no `macroCondition`, no `getGlobalConfig`, no
  "Assertion Failed" strings, and no `json-to-ast` parser code. (`json-to-ast` appears in the
  sourcemap's `sources` list but contributes no bytes — an artifact of how Rollup records
  sources, not a shipped dependency. Don't re-open this without checking the output strings.)
- **CDN cache headers are already correct** — 30 days, zstd, CORS-open. The "cache
  everything for a week with no freshness request" ask is already satisfied for hashed
  assets; what's missing is item 1 making the service worker actually point at them.
- **`ember-phosphor-icons` tree-shakes correctly** — 87 kB for ~40 per-icon component
  imports, not the whole icon set. Leave it.
- **Highcharts is already optimally split** — three dynamic chunks, no accessibility module.
  See the Highcharts section in CLAUDE.md.
- **`@embroider/router` (item 6's rejected route-splitting alternative) is an unused
  dependency, but its `splitAtRoutes` mechanism is real and does still work with this
  app's Vite build** — worth knowing precisely if a future route ever gets heavy enough on
  its own component code (not a single swappable dependency like `marked` was) to justify
  it. Verified by reading the installed packages, not assumed: [app/router.ts](app/router.ts)
  extends the plain `@ember/routing/router`, never `@embroider/router`'s (`@embroider/router`
  is a tiny extension of the stock router that only activates lazy-loaded route bundles it
  finds — installing it and switching `router.ts` to extend it is a prerequisite, not
  optional). The actual splitting logic lives one layer down, in `@embroider/core` (its
  `resolver-loader.js` and `virtual-route-entrypoint.js` both reference `splitAtRoutes`) and
  is threaded through by `@embroider/compat`'s `compat-app-builder.js` from `EmberApp`'s own
  options (`this.options.splitAtRoutes`) — i.e. it flows through
  [ember-cli-build.mjs](ember-cli-build.mjs)'s existing `new EmberAppDefault(defaults, {...})`
  call, the same place `babel.plugins` is already set, as `{ splitAtRoutes: [...] }`. This is
  confirmed present in the exact `@embroider/vite`/`@embroider/core` versions this app has
  installed — it is not a classic-build-only feature that quietly stopped working under Vite.
  Its own README lists two real costs to weigh before reaching for it: the `serialize` hook on
  `Route` stops working for a lazy route, and any route unit test that does
  `owner.lookup('route:name')` needs to explicitly import and register that Route first,
  since it's no longer guaranteed loaded.
- **`manualChunks` would not help.** Splitting statically-imported code into more chunks
  changes nothing about how much must be parsed before boot; only the dynamic imports in
  items 4 and 6 do.

Dev-environment cleanup audit (2026-07-11). Baseline for comparison: the stock
`ember-cli` 6.3.1 app blueprint + `@ember/app-blueprint` (Vite) overlay, TypeScript
variant. Each section below is worked as one focused commit that also removes its
section; sections under "Assessed — no change" are recorded findings, not work items.

## Assessed — no change needed (audit findings, prune after reading)

- **`docker compose exec` overhead:** measured `docker compose exec ui true` at
  0.09–0.19 s. Negligible next to any pnpm/vite/testem startup it wraps. Verdict: keep
  the container workflow exactly as is; a host-side wrapper/shim would add setup and
  drift for ~0.1 s/call. Not worth it.
- **`test` script enumerates `pnpm:test:ember` instead of stock `pnpm:test:*`:**
  deliberate — the stock glob would also match `test:ember:dev` and
  `test:ember:dev:server`, which never exit (that was the "pnpm test hangs forever" bug).
  Keep the explicit form.
- **`lint:css:fix` is direct (`stylelint … --fix`) instead of stock's
  `concurrently "pnpm:lint:css -- --fix"`:** ours is simpler and equivalent; the stock
  form is pointless indirection. Keep ours.
- **`EMBROIDER_WORKING_DIRECTORY` prefix on `test:ember`:** load-bearing isolation
  against the dev-server corruption bug (TROUBLESHOOTING.md). Keep.
- **Exact `engines`/`packageManager` pins:** intentional — the container and CI pin the
  same versions. Stock's `">= 18"` would reintroduce host drift. Keep.
- **In-repo `npx` occurrences:** only stock comments in `eslint.config.mjs`. Harmless;
  the real npx habit lives in docs/sessions and is addressed by the policy line in §6.
