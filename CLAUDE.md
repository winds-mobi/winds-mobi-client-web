# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single Ember application at the repo root: the web client for [winds.mobi](https://winds.mobi),
a live wind/weather station map for free-flight (paragliding/hang-gliding) pilots. It renders a
MapLibre map of stations, per-station detail panels with Highcharts time series, a nearby-stations
view backed by geolocation, and search.

Stack: Ember 6 (Octane, Polaris-style `.gts`/TypeScript), Vite + Embroider, Warp Drive / EmberData
5.8 (schema-record reactive store), Frontile components, Tailwind CSS v4, ember-intl, ember-concurrency,
ember-maplibre-gl, ember-highcharts. Package manager is **pnpm** (pinned via `packageManager`); Node is
pinned in `engines`.

## Authoritative external references

- **Ember best practices:** use the `ember-mcp` tools (search docs, API reference, best practices) before
  writing non-trivial Ember/Polaris code.
- **Warp Drive / EmberData** request, builder, handler, and `<Request>` patterns: https://warp-drive.io/llms-full.txt

## Commands

- `pnpm install` — install dependencies (a `postinstall` rebuilds `sharp`).
- `pnpm start` — Vite dev server on `0.0.0.0`, app at http://localhost:4200 (tests at `/tests`).
- `pnpm build` — production Vite build. `pnpm ember build` for a development build.
- `pnpm lint` — runs all linters in parallel (`eslint`, `ember-template-lint`, `stylelint`, prettier `--check`).
- `pnpm lint:fix` — autofix all linters, then `prettier --write`.
- `pnpm format` — prettier write only.

### Tests

- `pnpm test` — full CI gate: lint + the ember test build/run.
- `pnpm test:ember` — isolated: `vite build --mode test` then `ember test --path dist`. Use only when the
  dev variant is unavailable or an isolated build-style run is specifically needed.
- `pnpm test:ember:dev` — runs tests against an already-running `pnpm start` dev server (assume one is up;
  **prefer this** while iterating). `pnpm test:ember:dev:server` opens an interactive Testem session.
- There is no per-file test script; filter with QUnit's `--filter` (e.g. `pnpm test:ember -- --filter "navbar search"`)
  or the test-page module/filter UI.

### Verification discipline

Do **not** run lint or tests while iterating unless the user asks. Verify only as the final pre-push step:
run `pnpm lint` (or targeted `pnpm lint:format`) plus the relevant `test:ember:dev` tests for what changed.

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
source of map math: parse/serialize/normalize views and bounds, equality checks, and `mapViewChangeRequiresStationRefetch`
(threshold gate so small pans don't refetch). The map component syncs query params → MapLibre declaratively (fly-to
from state) rather than imperatively writing back mid-interaction. Keep this direction; don't reintroduce imperative
view bookkeeping.

### Routes & services

Routes: `map` (with nested `map/:station_id` detail panel), `nearby`, `help`; `index` redirects to `map`.

Services ([app/services/](app/services/)) hold only cross-cutting, long-lived concerns: `store`, `map-refresh`
(ref-counted auto-refresh loop driving the countdown, ember-concurrency `restartable` task), `time-series-sync`
(keeps multiple Highcharts x-axes in sync), `nearby-location` (geolocation + Permissions API state machine).
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

### Station detail sections

- Sections that split a Warp Drive `<Request>` wrapper from a presenter live in a subdirectory with `index.gts`
  (the fetcher) and `presenter.gts` (the view) — see [app/components/station/](app/components/station/).
- Keep historical-request `keys` aligned with what each section actually renders:
  - [last-hour/index.gts](app/components/station/last-hour/index.gts): `w-dir`, `w-avg`, `w-max`
  - [wind/index.gts](app/components/station/wind/index.gts): `w-dir`, `w-avg`, `w-max`
  - [air/index.gts](app/components/station/air/index.gts): `temp`, `hum`, `rain`

### Highcharts

- Treat `highcharts` as a real, current app dependency (not a transitive peer). If wind/air stock-chart range-selector
  buttons break, suspect a Highcharts module/version mismatch first and prefer upgrading `highcharts`/`ember-highcharts`
  over app-side loading workarounds.

### i18n & relative time

- All UI strings live in [translations/en-us.yaml](translations/en-us.yaml); update it whenever UI text changes.
- Never call ember-intl `formatRelativeTime` directly in UI. Use the shared `time-ago` helper
  ([app/helpers/time-ago.ts](app/helpers/time-ago.ts)), or `renderTimeAgoText` in TS, so wording stays consistent and
  auto-switches units.

### UI

- Reuse existing Frontile + Tailwind patterns for shared UI before introducing new ones.

### Testing

- Acceptance tests register fake store services that satisfy requests by `url` and return typed `Station`/`History`
  fixtures (see [tests/acceptance/](tests/acceptance/)).
- Do **not** add test-only seams, exposed instance handles, or DOM hacks to production components to make them testable.
  DOM selectors in tests are fine; production test hooks are not. Prefer a smaller real test, or skip the test, over
  complicating the production API.

### Changelog

- Keep [CHANGELOG.md](CHANGELOG.md) user-facing: shipped behavior, visible improvements, notable fixes. Omit internal
  refactors, test-only changes, and implementation details unless they directly affect users.

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
