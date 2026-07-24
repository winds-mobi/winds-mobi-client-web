# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single Ember application at the repo root: the web client for [winds.mobi](https://winds.mobi),
a live wind/weather station map for free-flight (paragliding/hang-gliding) pilots. It renders a
MapLibre map of stations, per-station detail panels with Highcharts time series, a nearby-stations
view backed by geolocation, and search.

Stack: Ember 6 (Octane, Polaris-style `.gts`/TypeScript), Vite + Embroider, Warp Drive / EmberData
5.8 (schema-record reactive store), Frontile components, Tailwind CSS v4, ember-intl, ember-concurrency,
ember-maplibre-gl, Highcharts (driven directly through this app's own modifiers, no wrapper addon — see
Highcharts below). Package manager is **pnpm** (pinned via `packageManager`); Node is pinned in `engines`.

## Authoritative external references

- **Ember best practices:** before writing non-trivial Ember/Polaris code, or when unsure how a Frontile/Ember API
  behaves, call the `ember-mcp` tools (`search_ember_docs`, `get_api_reference`, `get_best_practices`) **first**.
  Do not grep/cat minified `node_modules/.pnpm/.../dist/*.js` to reverse-engineer Frontile/Ember/addon internals —
  that's slower and less reliable than the docs tools and is a known time sink in past sessions. Only fall back to
  reading dist files if `ember-mcp` and the package's own README/CHANGELOG come up empty.
- **Frontile component docs/API/theming/migrations:** Frontile has no `llms.txt`; fetch the relevant markdown
  straight from the source repo, e.g. `https://raw.githubusercontent.com/josemarluedke/frontile/main/docs/<path>.md`
  (browse `https://github.com/josemarluedke/frontile/tree/main/docs` for the index — component docs, `theming/`,
  `migrations/`). Check this before falling back to dist-file archaeology.
- **Warp Drive / EmberData** request, builder, handler, and `<Request>` patterns: https://warp-drive.io/llms-full.txt

## Commands

- This project runs in a dev container (`compose.yaml`, service `ui`) with the correct pinned Node (`24.4.1`) and a
  clean `node_modules`. **Run `pnpm` commands via `docker compose exec ui <cmd>`** (e.g.
  `docker compose exec ui pnpm build`), not directly on the host. Host runs use whatever Node/pnpm and leftover
  `node_modules` happen to be installed locally (e.g. Homebrew Node), which has produced spurious warnings — Node
  engine-version mismatches, duplicate native `sharp-libvips` dylib warnings — that don't occur in the container and
  are not real app issues. Confirm the container is up first with `docker compose ps`.
- **pnpm only.** Never `npm`/`yarn`, and never bare `npx` (it network-installs anything not already local).
  Use `pnpm <script>` for scripts and `pnpm exec <bin>` for local binaries.
- `pnpm install` — install dependencies.
- `pnpm start` — Vite dev server on `0.0.0.0`, app at http://localhost:4200 (tests at `/tests`).
- `pnpm build` — production Vite build. `pnpm ember build` for a development build.
- `pnpm lint` — runs all linters in parallel (`eslint`, `ember-template-lint`, `stylelint`, prettier `--check`).
- `pnpm lint:fix` — autofix all linters, then `prettier --write`.
- `pnpm format` — prettier write only.

### Tests

- `pnpm test` — full CI gate: lint + the ember test build/run.
- `pnpm test:ember` — isolated: `vite build --mode test` then `ember test --path dist`. Use only when the
  dev variant is unavailable or an isolated build-style run is specifically needed. Its build runs under its own
  `EMBROIDER_WORKING_DIRECTORY` (`node_modules/.embroider-test`), so it's safe to run in the container alongside
  the live `pnpm start` server — that isolation is load-bearing: without it, the test build corrupts the dev
  server's shared `content-for.json` and the app page goes blank until the container restarts. Keep the prefix, and
  never run a raw `vite build` in the container without it. See
  [TROUBLESHOOTING.md](TROUBLESHOOTING.md#the-dev-server-shows-a-blank-white-page-after-running-pnpm-testember).
- `pnpm test:ember:dev` — runs tests against an already-running `pnpm start` dev server (assume one is up;
  **prefer this** while iterating). `pnpm test:ember:dev:server` opens an interactive Testem session.
- There is no per-file test script; filter with QUnit's `--filter` (e.g. `pnpm test:ember -- --filter "navbar search"`)
  or the test-page module/filter UI.

### Verification discipline

Do **not** run lint or tests while iterating unless the user asks. Verify only as the final pre-push step:
run `pnpm lint` (or targeted `pnpm lint:format`) plus the relevant `test:ember:dev` tests for what changed.
When lint fails, run `pnpm lint:fix` first and hand-fix only what the fixers can't reach (some rules, e.g.
`no-useless-escape` and most type-aware ones, have no autofix).

Screenshots for visual verification (e.g. attaching a preview to a PR) are fine to take with the dev
container's existing system Chromium (`/usr/bin/chromium` — the same binary Testem already launches for
headless test runs, no separate tool to install):

```
docker compose exec ui chromium --headless --disable-gpu --no-sandbox --disable-dev-shm-usage \
  --window-size=1440,900 --screenshot=/tmp/shot.png 'http://localhost:4200/<route>'
docker cp winds-mobi-client-web-ui-1:/tmp/shot.png ./shot.png
```

Map/canvas routes are the one caveat: MapLibre needs WebGL, which this headless setup doesn't provide (see
`tests/helpers/webgl.ts`), so a map screenshot will render blank/broken — expected, not a bug in the shot.
Everything else (Settings, station panels, nearby/favourites lists, etc.) renders normally. Still run
`pnpm lint` and the relevant tests as the actual verification; a screenshot is a visual aid on top; it doesn't replace them.

## Architecture

### Data flow: builders → store.request → handlers → schema-record

There is no `fetch()` in app code and no classic EmberData adapters/serializers. All reads go through Warp Drive:

1. **Builders** ([app/builders/](app/builders/)) construct typed request objects. [station.ts](app/builders/station.ts)
   exposes `findRecord`, `query`, `mapQuery` (bounding box, capped at 470), `nearbyQuery` (`near-lat`/`near-lon`),
   and `searchQuery`. Builders inject default `keys` (sparse-fieldset selection) and `arrayFormat: 'repeat'` query
   serialization. Narrow `keys` to exactly what the consuming UI needs.
2. **`this.store.request(builder(...))`** issues the request. The API base URL/namespace is set once in
   [app/app.ts](app/app.ts) via `setBuildURLConfig` (`https://winds.mobi/api`, namespace `2.3`; a commented
   localhost line is the dev override).
3. **Handlers** ([app/handlers/](app/handlers/)) reshape the upstream non-JSON:API payload into JSON:API. The
   station handler renames terse API fields (`pv-name` to `providerName`, `w-avg` to `speed`, `last._id` (seconds)
   to a millisecond `timestamp`, etc.) and normalizes `url`/`pres`. **Handlers must omit absent station-level and
   `last.*` attributes entirely — never serialize a missing field as `undefined`.** Warp Drive upsert merges partial
   payloads only one level deep, so emitting only present primitive fields lets the same identity be refetched with
   different `keys` safely; do not rely on deep partial merges for object-valued fields.
4. **Schema-record store** ([app/services/store.ts](app/services/store.ts)) defines reactive schemas, not Models:
   `StationSchema` (with embedded `location`/`reading`/`pressure` `schema-object`s and **derived** `latitude`/
   `longitude` unwrapped from `location.coordinates`) and `HistorySchema`. Exported `Station`/`History` TS types are
   the shape consumers code against. When adding a field, update the schema, the handler mapping, the builder `keys`,
   and the type together.

In components, read responses through the `<Request>` component or `getRequestState`, and unwrap data with
`responseData` from [app/utils/request-response.ts](app/utils/request-response.ts) (handles both `{data}` and
`{content:{data}}` shapes).

### Map state is unidirectional and lives in query params

Map center/zoom are route query params on [app/controllers/map.ts](app/controllers/map.ts) (`mapLng`/`mapLat`/
`mapZoom`), making views shareable and refresh-stable. [app/utils/map-view.ts](app/utils/map-view.ts) is the single
source of map math: parse/serialize/normalize views, equality checks, `boundsFromMap` (reads MapLibre's `getBounds`),
and `roundBoundsForRequest` (snaps the captured bounds to the refetch grid so sub-threshold pans don't refetch). The map
component syncs query params → MapLibre declaratively (fly-to from state) rather than imperatively writing back
mid-interaction. Keep this direction; don't reintroduce imperative view bookkeeping.

**The two directions, and why `moveend` only writes back for user gestures** (learned the hard way — don't undo this):

- **URL → map → request.** A declarative `<map.call @func="flyTo">` flies the map to the routed view whenever it
  changes (deep link, search select, logo reset, locate). The station **request follows the live map, not the URL**:
  `captureBounds` reads `map.getBounds()` on the map's `idle` event into a tracked `requestBounds` (rounded via
  `roundBoundsForRequest`, deduped), and the `request` getter derives from that — so it covers exactly what's on screen,
  including pitched/rotated views, and a resize or any settle refetches without the query params changing. `mapQuery`
  caps the result at 470. Capturing on `idle` (not `moveend`) is deliberate: `idle` fires _after_ render, so writing
  `requestBounds` can't hit the backtracking assertion the `moveend` guard below avoids.
- **map → URL only on user gestures.** `handleMoveEnd` calls `router.replaceWith` **only when `event.originalEvent` is
  set** (a real pan/zoom). It must _not_ write back on programmatic moves, because:
  - the initial/style-driven settle reports a slightly different view (notably in tests) and would drift the URL; and
  - our own fly-to, or a fly-to triggered by a route transition (e.g. selecting a search result), fires `moveend`
    **synchronously while the router transition is still computing**, and `replaceWith` there throws Ember's
    "`targetState` … already used in the same computation" backtracking assertion → unrecoverable render loop. The
    browser usually hides this because fly-to _animates_ (async), but it bites synchronous cases: the acceptance tests,
    and real users with `prefers-reduced-motion: reduce` (MapLibre jumps instantly). **If the map-panel/search tests
    hang or 60s-timeout, this is why — keep the `originalEvent` guard.**
- **Programmatic moves that _should_ refetch handle it at the source, not in `moveend`.** The geolocate/locate fly is
  programmatic (no `originalEvent`), so the `geolocate` event handler explicitly `replaceWith`s the located position
  (which drives the refetch); the control is `trackUserLocation: false` so it locates once instead of fighting manual
  pans. MapLibre fires `new Event('geolocate', position)` — the `GeolocationPosition` fields are spread onto the event,
  so read `event.coords` (there is no `event.data`).

### Routes & services

Routes: `map` (with nested `map/:station_id` detail panel), `nearby`, `favorites`, `auth-callback` (path
`/auth/callback`), `settings`, `help`; `index` redirects to `map`.

Services ([app/services/](app/services/)) hold only cross-cutting, long-lived concerns: `store`, `map-refresh`
(ref-counted auto-refresh loop driving the countdown, ember-concurrency `restartable` task), `nearby-location`
(geolocation + Permissions API state machine), `settings` (persisted display preferences, see
[Settings persistence](#settings-persistence-tracked-local-storage) below), and ember-simple-auth's `session`
(`app/authenticators/winds-mobi.ts`; sign-in is currently disabled — the code is kept commented, marked
`TODO: Remove login`, and favourites are localStorage-only with no cross-device sync).
Route/component-local UI state (open panels, selected tab, map view) does **not** belong in services — use component
state, route models, and query params.

## Conventions (enforced — follow these)

### Ember / reactivity

- Prefer simple, typed Ember. Assume config, declared deps, and API payloads are correct unless there's a proven issue.
  If a request would require hacks, brittle workarounds, or patterns that cut against Ember/app architecture, push back
  and explain before proceeding.
- **No manual loading/pending flags.** Never add `@tracked isLoading`/`isPending`/`loading`-style booleans, and don't
  write temporal state back after an `await` to mirror a request lifecycle. Use `<Request>` / `getRequestState` /
  ember-concurrency task state so loading/error/data stay synchronized.
- **Prefer declarative, derived state.** Express derived data as `get` getters from tracked/route/query-param state.
  Excessive local `@tracked` is a smell — look for a simpler root state to derive from. Don't add duplicate guard state
  preemptively; only add "pending/applied/in-flight" tracking after confirming a real rerender or repeated-invocation bug.
- **No imperative bookkeeping in untracked private fields.** Don't reach for plain `#flag`/`#counter`/`#didX` fields to
  gate one-time setup, dedupe stale async results, or remember "have I done this yet." That's imperative state that
  side-steps reactivity. Instead: subscribe/teardown once via a **modifier**; derive one-shot conditions from existing
  state (e.g. "still the default view?") so they self-disarm; and detect stale async by comparing the current cached
  value/Future identity rather than a version counter. Reactive state that the template reads must be `@tracked`.
- Keep imperative DOM / third-party library integration inside **modifiers** ([app/modifiers/](app/modifiers/)).
- **Never use Ember's runloop** (`@ember/runloop`: `scheduleOnce`, `next`, `later`, `debounce`, `run`, etc.). If you
  reach for it to defer a state write or break a render cycle, that's a signal the state is modeled imperatively —
  re-derive it from tracked/route/query-param state instead. For async coordination use ember-concurrency.
- Subscribe to service/router/library events with a **module-scope `ember-modifier`**, not `constructor`/`willDestroy`:
  define the modifier, attach it to an element in the template, and return the teardown function. Example:
  ```js
  import { modifier } from 'ember-modifier';
  const onRouteChange = modifier((_, [router, callback]) => {
    router.on('routeDidChange', callback);
    return () => router.off('routeDidChange', callback);
  });
  // template: {{onRouteChange this.router this.closeSidebar}}
  ```
- Never use raw DOM events when a component/addon (Frontile, etc.) exposes a supported callback/argument/modifier API —
  reach for the framework surface first.
- No startup-time hacks (app initializers, bundler aliases) to force third-party libs to work. Prefer package upgrades
  or supported integration points; stop and discuss before adding that kind of workaround.
- **Don't reinvent the wheel — but verify before adopting.** When a new paradigm/need comes up (state persistence,
  browser-API mocking, etc.), check whether a maintained community addon already solves it before hand-rolling. Prefer
  it if it's a good fit: actively maintained (recent release, real download/usage numbers — compare candidates on both
  before picking one), and — critically — **empirically verified against this app's Vite/Embroider pipeline**, not
  assumed compatible. This stack has burned time on both outcomes:
  - `ember-cli-mirage` was evaluated for acceptance-test fixtures and **rejected**: it's a classic (non-v2) addon
    whose `read-modules.js` does a runtime `require()` that Rollup can't resolve as ESM — `pnpm build` fails outright,
    not just in dev. The existing fake-`service:store`-by-URL pattern (see Testing below) remains the right tool here.
  - `ember-tracked-local-storage` replaced this app's hand-rolled `trackedInLocalStorage` decorator (see
    [Settings persistence](#settings-persistence-tracked-local-storage)) and was **adopted**: also a classic addon,
    but it builds cleanly, and its per-owner `service:tracked-local-storage` architecture is a genuine improvement
    over the module-scope singleton the hand-rolled version used.
  - The verification method that told these two apart: install it, exercise its actual API in a throwaway scratch
    component/test (not just import it), then run `pnpm build` (the _production_ build, not just `pnpm test:ember`) —
    dev-mode success alone doesn't prove the Rollup/Vite production bundle will succeed. Delete the scratch files
    before committing either way.
- When async coordination fits **ember-concurrency**, prefer it over manual timer/promise bookkeeping, using current
  syntax. If newer ember-concurrency APIs would require installing/upgrading, stop and tell the user first.
- Don't add speculative component arguments as override points with no real call site. If a component has an internal
  default and no external caller overrides it, remove the argument rather than keeping a "future-proof" escape hatch.
- Don't add trivial passthrough getters just to feed translated strings/direct values to a child — use `{{t ...}}`
  directly in the template when no class logic is needed.
- Prefer Tailwind responsive classes for layout/breakpoint variants; don't add component args or class logic to switch
  layouts across breakpoints.

### Services

- Two and only two `@ember/service` import patterns: `import Service from '@ember/service'` to define a class, and
  `import { service } from '@ember/service'` to inject. **Never** import `inject` (including `inject as service`).
- Keep service APIs small and explicit; consumers call methods/tasks rather than mutating service state ad hoc. Don't
  use services as event buses. Use `@tracked` / tracked-built-ins for reactive state.
- Add a registry typing for every app service: `declare module '@ember/service' { interface Registry { ... } }`.

### Settings persistence (tracked-local-storage)

`app/services/settings.ts` persists user display preferences via `ember-tracked-local-storage`'s
`@trackedInLocalStorage` decorator (not a hand-rolled one — see the addon-first note above). Two things that aren't
obvious from the decorator call site:

- The default value is a **decorator option** (`{ keyName, defaultValue }`), not a field initializer — the addon
  doesn't infer it from `= true`. The stored value is omitted from `localStorage` while it equals `defaultValue`, so
  defaults can evolve later without a migration.
- The addon ships **no TypeScript types** (plain JS + JSDoc). `types/ember-tracked-local-storage.d.ts` is an ambient
  declaration recovering type safety for both the decorator and the injectable `service:tracked-local-storage` it's
  backed by (registered on `@ember/service`'s `Registry` per the convention above) — extend that file, don't scatter
  `as any` casts, if you touch this surface.
- **In tests, reset via the service, never raw `localStorage`.** The service owns an in-memory reactive cell per key
  that's seeded from `localStorage` exactly once; a bare `window.localStorage.removeItem(key)` clears the persisted
  value but leaves the cached cell stale, silently leaking a previous test's value into the next one — even across
  files, since QUnit runs the whole suite in one page load. `tests/helpers/index.ts`'s shared setup already calls
  `owner.lookup('service:tracked-local-storage').clear()` before every test (matching the addon's own test suite's
  convention), so this should be automatic — don't add per-file `localStorage.removeItem` guards back.

### Station detail sections

- Sections that split a Warp Drive `<Request>` wrapper from a presenter live in a subdirectory with `index.gts`
  (the fetcher) and `presenter.gts` (the view) — see [app/components/station/](app/components/station/).
- Keep historical-request `keys` aligned with what each section actually renders:
  - [last-hour/index.gts](app/components/station/last-hour/index.gts): `w-dir`, `w-avg`, `w-max`
  - [wind/index.gts](app/components/station/wind/index.gts): `w-dir`, `w-avg`, `w-max`
  - [air/index.gts](app/components/station/air/index.gts): `temp`, `hum`, `rain`

### Highcharts

- **No `ember-highcharts`.** Both chart wrappers ([chart/polar.gts](app/components/chart/polar.gts),
  [chart/time-series.gts](app/components/chart/time-series.gts)) drive real Highcharts directly through one shared
  class-based modifier ([modifiers/render-highcharts.ts](app/modifiers/render-highcharts.ts), invoked with a
  `"chart"`/`"stockChart"` kind), which itself uses a create/update helper
  ([utils/highcharts-lifecycle.ts](app/utils/highcharts-lifecycle.ts)). This replaced the addon (previously the only
  Ember-specific Highcharts wrapper that existed) after tracing a real bug (issue #137, see below) to a piece of its
  own update logic that had gone unrevisited since 2016 and had no open upstream issue covering it — owning the
  update path ourselves both fixed that root cause and let the app move straight onto the current Highcharts major
  (`highcharts` is a real, current, direct app dependency, not a transitive peer). Only the exact modules this app
  actually uses are imported, each as its own dynamically-`import()`ed chunk wrapped in `@ember/test-waiters`'
  `waitForPromise` (so test helpers' `await settled()` waits for chart creation): `highcharts/modules/stock` for the
  wind/air stock charts, `highcharts/highcharts-more` for the polar wind-direction chart's pane/radial-axis support.
  Deliberately not imported: the accessibility module (ember-highcharts always loaded it; this app disables
  accessibility on every chart anyway, see each component's `accessibility: { enabled: false }` and its comment).
- **Series updates never let Highcharts match old points to new ones.** `updateChart` (in
  utils/highcharts-lifecycle.ts) always calls `series.setData(data, false, false, false)` — that last `false` is
  `updatePoints`, Highcharts' own point-matching-for-animation feature, off unconditionally. This is the fix for
  issue #111 ("glitches with wind direction history"): a station switch that resolves from Warp Drive's cache
  without a `:loading` gap reuses the same chart instance/DOM node (confirmed live against the real app by tagging
  the rendered `.highcharts-container` node across a station-A → station-B → station-A-revisit sequence), and
  Highcharts' default point-matching falls back to raw x value when it can't match an incoming point by id — for
  the polar chart that's wind direction, a coarse 0-360 value that collides constantly, both across two different
  stations' data and within one station's own sliding-window refresh (a reading that just expired and a brand-new
  reading can share a direction by coincidence). The mismatch displaces one point to the wrong position in the
  array — every value stays individually correct, but the connecting line's draw order doesn't, which is what
  actually reads as a "tangled path." Two earlier fix attempts were tried and abandoned once this was found: giving
  each point an explicit Highcharts `id` (doesn't help — a never-seen id still falls through to the x-value
  fallback) and keying the chart's render on `@stationId` via `{{#each (array @stationId)}}` to force a teardown on
  station switches (works for that one case, but not for the same-station sliding-window case, since the key
  doesn't change then). Before the `ember-highcharts` rewrite, this same fix was expressed as a chart-level
  `chart.allowMutatingData: false` option (that flag no longer exists in either chart component — don't add it
  back; the fix now lives in `updateChart`'s own `setData` call). Measured no meaningful performance difference at
  this app's data volumes (a few dozen points for the polar chart, up to ~1500 for the 5-day wind/air charts) — the
  docs' "might decrease performance" warning for disabling point-matching is written for far larger datasets than
  this app ever renders.
- **The wind/air range selector resets to its default ("6h") on every station change, not on every refresh.**
  `render-highcharts.ts` re-applies `rangeSelector`'s default button (`RangeSelector#clickButton`) only when
  `@stationId` itself changes, leaving an ordinary same-station background refresh free to preserve whatever range
  is currently showing. This is the fix for issue #137: naive chart-update logic (this app's own former use of
  `ember-highcharts`, and likely any other integration that calls `chart.xAxis[0].setExtremes()` unconditionally
  after every update, as that addon's own `onDidUpdate` did) resets the visible range to "all data" on _any_ update
  to an already-existing chart instance, not just a station switch — see
  [tests/integration/components/chart/range-selector-reset-test.ts](tests/integration/components/chart/range-selector-reset-test.ts).

### i18n & relative time

- All UI strings live in [translations/en-us.yaml](translations/en-us.yaml); update it whenever UI text changes. A
  duplicated top-level or nested key in this file is invalid YAML under js-yaml's strict parser and crashes the Vite
  dev server outright (`YAMLException: duplicated mapping key`) — not a lint warning, a hard boot failure. Watch for
  this after copy-pasting a block of translation keys.
- Never call ember-intl `formatRelativeTime` directly in UI. Use the shared `time-ago` helper
  ([app/helpers/time-ago.ts](app/helpers/time-ago.ts)), or `renderTimeAgoText` in TS, so wording stays consistent and
  auto-switches units.

### UI

- Reuse existing Frontile + Tailwind patterns for shared UI before introducing new ones.
- **Always use Frontile's `<Button>` (`@frontile/buttons`) instead of a bare HTML `<button>`.** Use `@onPress`
  (not an `{{on "click" ...}}` modifier). Reach for `@appearance="custom"` (plus an explicit `@intent="default"`,
  since `custom`'s own default intent resolves to `primary`) when a button needs fully bespoke, non-thematic
  coloring — `custom` has no background/hover compound classes of its own to fight, unlike
  `minimal`/`outlined`/`default`. Only a handful of _non-button_ clickable custom elements are legitimate
  exceptions (e.g. `<LinkTo>` navigation) — a plain `<button>` standing in for one is not.
  - **The on-map station marker ([map/station-marker.gts](app/components/map/station-marker.gts)) is a
    deliberate exception, and isn't a button at all — not even Frontile's.** It's a plain, non-interactive
    `<div>`; selecting a station is wired up in [map/index.gts](app/components/map/index.gts) via
    `<marker.on @event="click" @action={{fn this.stationSelected station}}>`, using the click MapLibre's own
    `Marker` already fires on itself (it uses this internally for popup-toggling). This replaced an earlier
    version with its own nested `<Button>` and `@onSelect` callback: MapLibre repositions every marker via a
    continuous CSS `transform` reassignment on every pan/zoom/momentum-settle, and stacking a second
    independently-transformed clickable element on top of that gave mobile browsers a second thing that could be
    moving mid-tap — a documented trigger for silently dropping a touch's synthesized click (a target moving
    between touchstart and touchend reads as a scroll, not a tap). Routing the click through the marker's own
    already-reliable element removes that. Traded away deliberately: keyboard Enter/Space activation, which the
    old `<Button>` gave for free — MapLibre's own keyboard handling on a marker only wires Enter/Space to
    toggling a popup, not a generic click, and this app has accepted that gap rather than wiring up a keyboard
    handler of its own.
  - **A `class` override does NOT tailwind-merge against the theme's own base/variant classes** — verified
    empirically (render a `<Button class="rounded-full">`, inspect `element.className`): both `rounded-sm` (the
    theme's base) and your `rounded-full` end up in the class list, and plain CSS source order — not attribute
    order — decides which one's declaration wins, which is effectively undefined from the call site. Whenever your
    `class` is meant to _replace_ a variant-driven utility (shape, size/padding, display), force it with Tailwind
    v4's `!` suffix (e.g. `rounded-full!`, `p-1!`, `flex!`) rather than relying on it winning by luck. This only
    matters for genuine conflicts (same CSS property); additive classes (new colors, `transition`, etc.) need no
    `!`. `@frontile/theme` does depend on `tailwind-merge` internally, but not for this — don't assume it applies
    to a plain `<Button class="...">` override without checking.

### Testing

- Acceptance tests register fake store services that satisfy requests by `url` and return typed `Station`/`History`
  fixtures (see [tests/acceptance/](tests/acceptance/)). This is deliberate over `ember-cli-mirage` — see the
  addon-first note above for why mirage doesn't work in this app at all (build-breaking, not just a style choice).
  Fake-store `request()` implementations that render history sections need to branch on `request.url` (e.g.
  `.includes('/historic/')`) and return an **array** for history vs. a single record for a station/profile fetch —
  returning the wrong shape doesn't error at the fake-store layer, it throws deep inside Highcharts (`data.map is not
a function`) when the chart tries to render it.
- Do **not** add test-only seams, exposed instance handles, or DOM hacks to production components to make them testable.
  DOM selectors in tests are fine; production test hooks are not. Prefer a smaller real test, or skip the test, over
  complicating the production API.
- **Stick to a library's public interface, but verify real effects when that's the only way to know our own code
  works.** Don't assert on a library's _own judgment calls_ over config we hand it — e.g. don't read Highcharts
  internals to check that `dataGrouping.approximation` groups points the way Highcharts itself decides to, or that a
  `timezone` option is interpreted the way Highcharts' own docs say it is. That's testing the library, not us, and
  it breaks/needs rewriting on every upstream behavior tweak (see the historical "Stop asserting on Highcharts' own
  rendering in component tests" commit). But when the only way to confirm _our_ code produced the right observable
  outcome is to look at what the library actually did with the data we gave it — its rendered DOM, an object it
  built from our input, a side effect it triggered — reading that is legitimate and sometimes the only real
  verification available. Concretely: reading `Highcharts.charts[...].series[0].data` to confirm _our_ component fed
  it points in the right order/identity (`tests/integration/components/chart/point-order-test.ts`, issue #111) is
  testing our own data-flow contract, not Highcharts' behavior, even though it pokes at Highcharts' internals to do
  it. The line: would this assertion need to change if the library shipped a different but equally valid internal
  algorithm for the same input? If yes, it's testing the library — stop. If no (the library's _observable output_
  is what any correct implementation would also produce from that input), it's testing us — keep it.
- **Never reach for raw DOM in tests** (`document.querySelector`/`querySelectorAll`, `getElementById`, `.textContent`,
  `.getAttribute`, etc.). Assert with **qunit-dom** (`assert.dom(selector).exists()/.hasText()/.hasAttribute(...)`, and
  `assert.dom(selector, rootElement)` to scope — e.g. `document.head` for head content); `hasAttribute` accepts a regex
  for partial matches. For non-assertion queries — `waitUntil` predicates, or collecting values for a `deepEqual` —
  use the `@ember/test-helpers` `find`/`findAll` helpers, never `document.querySelector*`. For asserting a rendered
  string whose exact ICU/Intl unit-format output isn't worth hand-deriving (e.g. `station/metric-card`'s
  `intl.formatNumber(..., {format: 'windSpeed'})`), capture it empirically via a throwaway debug render
  (`console.log` the text, read it from the test-runner output, delete the debug test) rather than guessing.
- `pnpm lint` runs ESLint (type-aware, cached) and Glint type-checking (`lint:types`, `ember-tsc --noEmit`)
  alongside the other linters, and CI enforces all of them. The tree is typecheck-clean — keep it that way; fix new
  errors rather than working around them. When a rendering test needs a custom `this` context type, extend
  `RenderedTestContext` from `tests/helpers` (it narrows `element` to `Element`, which qunit-dom's target/rootElement
  params require); non-rendering contexts extend `@ember/test-helpers`'s `TestContext`. A context type that extends
  neither leaves `this.owner`/`this.element` untyped and cascades into `no-unsafe-*` errors downstream.
- Some acceptance tests need MapLibre's `idle` event, which never fires in this dev container (no WebGL in headless
  Chromium here). These fail locally but should pass in a real browser/CI with WebGL; don't chase them as regressions
  without checking whether they're in this category first (symptom: `waitUntil timed out` + a `Failed to initialize
map (likely WebGL issue)` console error in the failure output). Because each of these burns a long timeout, a full
  unfiltered `pnpm test:ember:dev` run in the container is very slow — prefer filtered runs
  (`pnpm test:ember:dev --test_page "tests/index.html?hidepassed&filter=<pattern>"`). If the testem browser ever
  again fails to connect at all ("testem.js not loaded?"), suspect the proxy target in `testem-dev.js` first — it
  must stay plain-http localhost, not the OrbStack HTTPS domain, because node's https client rejects OrbStack's CA
  and 500s every proxied page request (root-caused 2026-07-11).

### Refactoring & cleanup

- When you spot a refactoring / DRY / simplification opportunity outside the task you were asked to do, **add it as a
  plan to [TODO.md](TODO.md)** — where it lives, the problem, the proposed fix — rather than acting on it inline. Work
  the TODO items only when asked, one focused commit each, and **vet each plan before executing** it: apparent
  repetition can be load-bearing (e.g. `bg-wind-NN`/`text-wind-NN` strings must stay literal so Tailwind's content
  scanner emits those utilities — deriving them from a token drops them from the built CSS).

### Changelog

- Keep [CHANGELOG.md](CHANGELOG.md) user-facing: shipped behavior, visible improvements, notable fixes. Omit internal
  refactors, test-only changes, and implementation details unless they directly affect users.
- Mark beta/stable transitions with a prefix on the entry: a new beta feature gets `**🧪 Beta:**`, and when a feature
  graduates from beta to stable (e.g. the gating toggle is removed), its entry gets `**🚀 Stable:**`.

### Don't touch

- Never edit generated/installed files (`dist/`, `node_modules/`).

## Commits

Do not create commits or push unless explicitly asked. When asked, use:

- a random emoji as the first character of the subject line
- a short subject describing intent
- a body with `Why:`, `How:`, and `Notes:` sections

```text
✨ Add map query param state

Why: Keep map view shareable and stable across refreshes.
How: Move center and zoom into route query params and sync them through the map modifier.
Notes: Leaflet-specific state was removed from the location service.
```
