# TODO — code cleanup plan

A prioritised plan to make the app cleaner, DRYer, and more idiomatic per the
conventions in [CLAUDE.md](CLAUDE.md). Each item lists the bad pattern, where it
lives, why it's a problem, and the proposed fix. Ordered roughly by impact.

---

## High impact

### 2. Duplicated per-card "reading" getters

- **Where:** [app/components/station/header.gts](app/components/station/header.gts),
  [app/components/station/compact-card.gts](app/components/station/compact-card.gts),
  [app/components/station/summary.gts](app/components/station/summary.gts).
- **Problem:** The same getters are copy-pasted across cards:
  - `lastReadingRelativeSeconds` (`station.last.timestamp / 1000 - Date.now() / 1000`) — header + compact-card (identical).
  - `lastReadingFreshnessClass`, `focusQueryParams` — header + compact-card (identical).
  - `reading` (`station.last`), `speedValueClass`/`gustsValueClass` (`windToTextClass(...)`) — summary + compact-card.
- **Fix:**
  - Move the relative-seconds math behind the time formatting: add a `time-ago`
    helper variant (or a `reading-freshness` util) that takes an absolute ms
    timestamp, so callers stop hand-rolling `timestamp/1000 - Date.now()/1000`.
  - `focusQueryParams` is just `focusQueryParamsFor(@station)` — call the util
    directly in the template (`@query={{focusQueryParamsFor @station}}`) and drop
    the getter (CLAUDE.md: no trivial passthrough getters).
  - For the wind value classes, prefer calling `windToTextClass` from the
    template, or share a tiny presenter if the markup is also shared.

### 3. `RequestStore` cast hack duplicated across files

- **Where:** [app/components/map/index.gts](app/components/map/index.gts) and
  [app/templates/nearby.gts](app/templates/nearby.gts) both define a local
  `type RequestStore = { request<T>(...) }` and do `this.store as unknown as RequestStore`.
- **Problem:** The `store` service type
  (`typeof import('.../services/store').default`) doesn't surface a typed generic
  `request<T>()`, so two call sites cast through `unknown`. Repeated type
  laundering is a smell and defeats the builders' typed return values.
- **Fix:** Type the store once so `.request<T>(builder(...))` is callable without
  casting — e.g. export a typed store interface from
  [app/services/store.ts](app/services/store.ts) and use it in the service
  Registry, then delete both local `RequestStore` types and the `as unknown as`
  casts.

---

## Medium impact

### 6. `wind-to-colour` colour table is repetitive (mostly load-bearing)

- **Where:** [app/helpers/wind-to-colour.ts](app/helpers/wind-to-colour.ts) `COLORS`.
- **Problem:** Each entry repeats `backgroundClass: 'bg-wind-NN'`,
  `color: 'var(--color-wind-NN)'`, `key: 'wind-NN'`, `textClass: 'text-wind-NN'`.
  `windBandForSpeed` also has an unreachable `?? { ... }` fallback duplicating the
  last band (the array is never empty).
- **Caveat (verified — don't redo this):** the `bg-wind-NN`/`text-wind-NN` strings
  **cannot** be built from a token via template literals. Tailwind v4 only emits a
  utility when its content scanner sees the literal class string, so deriving them
  drops `bg-wind-05…50`/`text-wind-*` from the built CSS (only ones that also appear
  literally elsewhere, e.g. `bg-wind-20` in the nav menus, survive). They must stay
  literal (or be safelisted via `@source inline(...)`).
- **Fix (what's actually safe):** drop the dead `?? {...}` fallback (return the last
  band). Deriving only `color`/`key` from a token while keeping the two class
  strings literal is possible but marginal.

### 10. One-time-setup flag in `nearby-location`

- **Where:** [app/services/nearby-location.ts](app/services/nearby-location.ts)
  `#hasSyncedPermissionState`.
- **Problem:** An untracked private boolean gating one-time setup is the
  "imperative bookkeeping to remember have-I-done-this" pattern CLAUDE.md calls out.
- **Fix:** Derive the "not yet synced" condition from existing state — the initial
  `permissionState === 'checking'` already represents "never synced", so it can
  self-disarm without a separate flag.

### 11. Chart presenter option/series duplication

- **Where:** [app/components/station/wind/presenter.gts](app/components/station/wind/presenter.gts),
  [app/components/station/air/presenter.gts](app/components/station/air/presenter.gts).
- **Problem:** The `yAxis` blocks repeat the same defaults (`endOnTick`,
  `maxPadding`, `minPadding`, `softMin`, `startOnTick`, `tickAmount`, label style),
  and `chartData` repeats `buildTimeSeriesData(history, e => e.timestamp, e => e.X)`
  per series with the identical timestamp accessor.
- **Fix:** Extract a `defaultYAxis(overrides)` helper in
  [app/utils/highcharts-options.ts](app/utils/highcharts-options.ts) and a
  `seriesFor(history, key)` helper that fixes the timestamp accessor.

---

## Suggested sequencing

1. The shared-typing fix **3** (unblocks cleaner call sites).
2. The structural DRY win **2** (per-card reading getters).
3. Reactivity correctness **10**.
4. The remaining items: **6** (only the dead fallback is safe — see its caveat)
   and **11**.

Verify each with `pnpm lint` and the relevant `test:ember:dev` tests (run inside
the dev container — `docker compose exec ui …`), per CLAUDE.md.
