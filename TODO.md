# TODO

## Wind threshold alarm (issue #161, branch `mb/wind-threshold-alarm`)

A per-station alarm: for each of the 8 compass directions, arm a wind-speed/gust threshold by
clicking a band on a radial compass-rose picker (each direction's own mini bar chart, using the
app's existing 10-band wind-color scale); get alerted (sound, pulsing bell, red marker ring)
whenever a station's latest reading crosses the armed threshold for its direction. Beta
feature, same local-storage-only / no-account model as favorites.

**Scope split, decided up front:** Phase 1 below is the whole client-side feature working
while the app (tab or installed PWA) is open in the foreground or backgrounded-but-not-killed.
Phase 2 ("alerts while the app is fully closed") is a separate, much larger, cross-repo
initiative — see its own section at the end for why it doesn't belong in this branch.

**Decisions confirmed with the issue author before implementation:**

- **No separate speed slider.** Superseded the original slider-based design: the compass rose
  itself is the speed control. Each of the 8 direction wedges is subdivided into 10 concentric
  rings, one per `WIND_COLOUR_BANDS` entry (`app/helpers/wind-to-colour.ts` — `wind-05` through
  `wind-50`, already the app's one canonical wind-speed color scale). Clicking a ring in a wedge
  arms that direction at that band, filling the wedge solid (in each band's own real color) from
  the center out to the clicked ring — i.e. "this direction, at this speed/gust or higher."
- **Un-arm gesture:** clicking the currently-topmost (armed) ring in a wedge again clears that
  direction back to off. Clicking a different ring in an already-armed direction just moves the
  threshold.
- **Threshold semantics: band-or-higher, not exact-band.** Arming `wind-30` for a direction
  means "alert at 30 km/h+ from that direction," not only-when-in-that-exact-band — evaluation
  compares band _index_ (`WIND_COLOUR_BANDS.findIndex`), not the raw km/h number.
- **All-directions-off is prevented, not given meaning.** The Save button stays disabled until
  at least one direction is armed — no "all-off = fires anywhere" behavior to implement or
  reason about in the evaluation engine.
- **8 sectors, not 16.** Reuses the app's existing `azimuth-to-cardinal.ts` (`DIRECTIONS` +
  its 45°-bucket logic) directly for both the compass-rose selector and evaluation — no new
  compass utility file needed.
- **Metric default**: gusts, per the issue.

### Phase 1 — client-side feature (this branch)

1. **`app/services/alarms.ts`.** Mirrors `app/services/favorites.ts`'s
   `@trackedInLocalStorage` pattern, confirmed to support arbitrary JSON-serializable values
   (not just primitives — the addon's `setItem`/`getItem` just `JSON.stringify`/`parse`), but
   stores a keyed object instead of favorites' plain id array:

   ```ts
   interface AlarmConfig {
     stationId: string;
     // length 8, indexed like DIRECTIONS in azimuth-to-cardinal.ts (N, NE, E, SE, S, SW, W, NW).
     // Each entry is an index into WIND_COLOUR_BANDS (0-9), or null if that direction is unarmed.
     directionBands: (number | null)[];
     metric: 'wind' | 'gusts';
     createdAt: number; // ms epoch, for the alarms-list sort order
   }
   @trackedInLocalStorage({ keyName: 'alarms.config', defaultValue: {} as Record<string, AlarmConfig> })
   configs!: Record<string, AlarmConfig>;
   ```

   `has`/`get`/`save`/`delete` methods, analogous to favorites' `has`/`add`/`remove`/`toggle`.
   Register the service typing in `@ember/service`'s `Registry` per convention. Note (from
   reading the addon source): the "omit from storage while equal to default" check is
   reference equality, so `delete()` returning a new object won't auto-clear the localStorage
   key back to absent the way it does for favorites' array — cosmetic only (reads back fine),
   not worth working around.

2. **Compass-rose selector component — spike first.** New
   `app/components/alarm/compass-rose.gts`: 8 wedges (45° each, reusing `DIRECTIONS` from
   `app/helpers/azimuth-to-cardinal.ts` for labels/indexing) × 10 concentric clickable rings
   (one per `WIND_COLOUR_BANDS` entry), bound to a `directionBands: (number | null)[]` arg.
   Click behavior: clicking ring `i` in wedge `d` sets `directionBands[d] = i` unless it's
   already `i`, in which case it clears to `null` (the confirmed un-arm gesture). Rendering:
   for an armed direction, fill rings `0..directionBands[d]` in each band's own real color
   (`WIND_COLOUR_BANDS[n].color`); rings above the armed index (or the whole wedge, if unarmed)
   render as a muted outline. No interactive/clickable SVG component exists in this app today —
   `chart/polar.gts` is Highcharts-rendered and read-only, not a template to copy directly for
   hit-testing; spike the wedge/ring geometry and click hit-testing before committing to the
   full build. Also needs a keyboard/screen-reader-operable path (e.g. one native `<input
type="range">` or `<select>` per direction, visually hidden but reachable, mirroring the same
   `directionBands` state) — plan this alongside the visual build, not as a follow-up. The
   modal's Save button (item 4) stays disabled while every direction is `null`. **Landed, plus
   a visible threshold readout added afterward:** once a direction is armed, its actual km/h
   threshold (the armed band's `min`, not `max` — band-or-higher semantics mean the alarm first
   fires exactly at that lower boundary) is listed below the rose (`armedThresholds`, one `<li>`
   per armed direction, standard Tailwind `text-xs`). **Went back and forth on where this
   lives**: a below-rose list first → moved onto the rose itself as a second `<tspan>` line
   under each direction letter (widening `CENTER`/`LABEL_RADIUS`/viewBox twice to fit it,
   first to a 7px arbitrary size, then to standard `text-xs` with more margin) → moved back to
   the original below-rose list, reverting the geometry to its original single-line values
   (`CENTER`/`LABEL_RADIUS`/viewBox back to 100/96/200×200). **Also added:** the station's
   current reading
   (`@currentDirection`/`@currentSpeed`/`@currentGusts`, passed in from `settings-modal.gts`'s
   `@station.last`) highlights its own direction sector's cells regardless of the fill color
   underneath — a solid dark outline on the current wind-speed cell, a dashed one on the current
   gusts cell (same cell if they land in the same band) — so the user can see where "now" sits
   relative to whatever threshold they're picking.

3. **Wind/gusts toggle.** Default `'gusts'`. **Went through several designs before landing:**
   Frontile `<Switch>` with its own label + description text → a boolean-on/off `Switch` was
   the wrong shape for a 2-way choice, so a segmented Wind/Gusts button pair (hand-rolled
   `<Button>`s with `!`-forced Tailwind classes) → that hand-rolled pair replaced with
   `@frontile/buttons`' real `<ButtonGroup>`/`<g.ToggleButton>` (confirmed shipped in the
   installed `0.17.1`) → reconsidered again ("the switch was better") back to `<Switch>`, now
   with `:startContent`/`:endContent` icons and no visible label/description text → icons
   dropped as redundant once flanking "Wind"/"Gusts" text labels were added outside the switch
   → `@intent="default"` found to render Frontile's switch track as neutral grey regardless of
   selected state (only `primary`/`success`/`warning`/`danger` tint it), addressing "no notion
   of on/off" — **final landed form**: `<RadioGroup>`/`<Radio>` (`@orientation="horizontal"`,
   group label hidden via `@classes={{hash label="sr-only"}}` rather than omitted, so the
   accessible name survives), per "the switch is a bit clunky." Needed the same
   `@glint-expect-error` as `Modal`/`Drawer`/`Popover` on the yielded `Radio`, unlike
   `ButtonGroup` which typechecked clean.

4. **Alarm settings modal.** First real usage of Frontile `<Modal>` in this app (confirmed:
   `@frontile/overlays@0.17.1` ships a `Modal` export, but nothing in the app imports it today
   — `Drawer` (`navbar/menu/mobile.gts`) and `Popover` (`navbar/search.gts`) are the closest
   existing call sites to mirror for the yielded-block API, both of which already carry a
   `@glint-expect-error` for a known 0.17.1/ember-source-7 typing gap on those yielded blocks —
   `Modal` needed the same). Composes the compass rose (2) + metric toggle (3) + Save button
   (disabled while every direction is unarmed), with a Delete button that only renders once a
   config already exists for the station (per issue). Renders through the existing app-root
   `<PortalTarget>`. **Revised:** the intro paragraph explaining how to tap the compass was
   removed outright — "if it needs explanation, then we did UX wrong" — rather than reworded;
   the compass-rose's own `max-w-64` cap was also dropped so it fills the modal's full width
   instead of sitting small and centered, per "maximise the real estate" feedback.

5. **Bell icon on `station/header.gts`.** Sits in the same flex row as the existing `<Heart>`
   favorite button, same `<Button appearance="minimal" size="xs">` + aria-pressed pattern,
   `ember-phosphor-icons`' Bell. Three static color states: outlined/slate (no config), filled
   amber (configured, not triggered), filled rose (triggered). Opens the modal from item 4.
   **Revised after landing:** the "triggered" signal does _not_ live on the bell button itself
   (red background) — moved to the whole card/panel instead (item 6 below), since
   `station/compact-card.gts` never renders this bell at all and would otherwise show no
   triggered signal whatsoever.

6. **Card/panel alarm glow.** New shared `ALARM_GLOW_CLASS` constant
   (`app/utils/alarm-glow-class.ts`) applied conditionally to `station/nearby-card.gts`,
   `station/compact-card.gts` (both converted to inject `@service alarms` if not already a class
   component), and `station/index.gts` (the map's station detail panel) whenever
   `alarms.triggeredStationIds` contains that station. Visible everywhere the station is shown
   as a card/panel, regardless of whether the bell itself is rendered there. **Revised twice
   after landing:** first from an `outline`-based approach to a plain `border-rose-500!` +
   `shadow-rose-500/50` pairing per explicit feedback ("just border & shadow") — the forced
   `border` override follows this app's existing `!`-suffix convention for same-property
   conflicts (see CLAUDE.md's Button `class` note), while the shadow color composes without
   needing it since it's a different custom property from the base `shadow-md`/`shadow-*` size
   utility; only the station detail panel's landscape/md breakpoints (an arbitrary `shadow-[...]`
   value that bakes its own color in) don't pick up the shadow tint, though the border still
   shows there. Second: dropped `animate-pulse` entirely — "the blinking part is annoying."

7. **`alarms` route + list page.** `this.route('alarms')` in `app/router.ts`, next to
   `favorites`. Template `app/templates/alarms.gts` mirrors `favorites.gts` exactly — not just
   its data-fetching structure (`Request`/`getRequestState`, `commitResolvedStations` modifier,
   `registerLoadingProbe`, built from `alarmsService`'s configured station ids via the new
   `alarmsQuery` builder), but its actual rendering too: the same `StationNearbyCard`/
   `StationCompactCard` components, switched on a new `settings.alarmsCompactList` (mirroring
   `favoritesCompactList`). Both cards already render `station/header.gts` internally, so the
   bell (item 5) — with its edit/delete access to the item-4 modal — comes for free, exactly
   the same control as on the station panel; no separate list-row component needed.

8. **Navbar entry.** Add an `alarms` item to `NAVBAR_MENU_ITEMS`
   (`app/components/navbar/menu/items.ts`) next to Favorites, extend its route union type, and
   gate visibility behind a new `settings.alarmsFeatureEnabled` beta flag mirroring
   `favoritesFeatureEnabled` — the issue explicitly calls this out as "New beta feature."

9. **Alarm evaluation engine.** An always-on watcher, mounted once at the app root
   (`app/templates/application.gts`, alongside the existing `<PortalTarget>`) so it runs
   regardless of the active route:

   - No need to activate `map-refresh` itself — turns out `Navbar`
     (`app/components/navbar/index.gts`) already holds a permanent, unconditional activation
     token via the existing `activate-map-refresh` modifier, and `Navbar` is always mounted
     (`app/templates/application.gts`). The watcher just reads `mapRefresh.lastRefresh` on each
     tick, same as `favorites.gts`/the new `alarms.gts` already do — no new modifier needed here.
   - Each tick, requests exactly the alarmed station ids with a narrow `keys` set (direction/
     speed/gusts/timestamp only) — same request-then-react shape as `commitResolvedStations`,
     used elsewhere to act on every resolved payload regardless of why it refetched.
   - For each resolved station: bucket its direction via `azimuthToCardinal`
     (`app/helpers/azimuth-to-cardinal.ts`) to get the 0-7 direction index, look up that
     direction's armed band index in `AlarmConfig.directionBands`, compute the reading's own
     band index via `WIND_COLOUR_BANDS.findIndex(...)` against the chosen `metric` (wind vs
     gusts), and trigger when the reading's band index >= the armed index (band-or-higher, per
     the confirmed semantics). Write the result into a `@tracked triggeredStationIds:
Set<string>` on the alarms service.
   - Edge-detect: diff against the previous tick's set so sound/pulse start exactly once per
     trigger transition, not on every refresh while a station stays above threshold.
   - Extract the actual matching logic (direction bucket + band comparison) as a plain,
     unit-testable function separate from the modifier/service plumbing — see item 12.

10. **Red marker ring on the map.** Extended `app/modifiers/select-map-marker.ts` to also accept
    `@isAlarmTriggered`, on the same MapLibre-owned parent element `SELECTED_CLASSES` already
    uses (required because MapLibre only reads `className` once at construction). **Revised
    after landing:** the alarm ring is a real, separate appended SVG `<circle>` element, not more
    classes on the same node selection uses — Tailwind's `ring-*` utilities all compose into one
    shared `box-shadow`, so a second `ring-*` for alarm would silently overwrite (not layer
    alongside) the selection ring's own, and a plain-class approach also couples the two
    indicators' shapes together for no reason. A separate element keeps them independently
    restylable (either could become a different shape later) and lets both render at once,
    concentrically — the alarm circle's radius went `r="46"` → `r="30"` (too snug — "just make it
    tiny bit smaller than the selection one") → `r="43"`, the final value, tucked just inside the
    selection ring's edge-hugging one. Marker sizing already uses real width/height, not CSS
    `scale`, so both track zoom/age scaling for free — no extra work there.
    Landed with a pulsing stroke, then dropped the pulse per the same "blinking is annoying"
    feedback as item 6 — now a plain static rose stroke.

11. **Alarm sound.** Add a short alarm audio asset under `public/`, played via the native
    `Audio` API from the evaluation engine (9) on each new trigger edge. **Real risk, not a
    detail:** browser autoplay policies block audio with no prior user gesture in the tab; this
    generally holds once the user has interacted with the app at all that session on
    Chrome/Firefox, but needs explicit manual verification on mobile Safari specifically, since
    pilots are overwhelmingly on phones and Safari's policy is the strictest. If blocked, the
    card/panel glow (6) and marker ring (10) are the real fallback signal — call this out
    explicitly in the PR, don't assume audio always plays.

12. **Tests.**

    - Unit: `alarms` service (save/get/delete), and the extracted matching function from item 9
      (direction bucketing, band-index comparison for both metrics, band-or-higher semantics).
    - Integration: bell icon's three states on `station/header`, modal open/save/delete flow
      (including the disabled-Save-while-unarmed state), compass-rose click/toggle behavior
      (keyboard path included).
    - Acceptance: configure an alarm, feed a fake-store response (existing
      fake-store-by-URL pattern, not mirage) that exceeds the threshold, assert bell/marker/
      alarms-list all reflect triggered state.

13. **Changelog.** `CHANGELOG.md` entry marked `**🧪 Beta:**` once functionally complete, per
    the project's beta/stable convention.

### Phase 2 — alerts while the app is fully closed (separate initiative, not this branch)

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
- **Recommendation:** ship Phase 1 in full, get real usage on the compass-rose/threshold UX,
  then scope Phase 2 as its own cross-repo initiative — it's larger than the rest of this
  feature combined and touches the account/sync model, not just this app.

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
