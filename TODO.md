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

---

## Medium impact

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

1. The structural DRY win **2** (per-card reading getters).
2. Reactivity correctness **10**.
3. The remaining item: **11**.

Verify each with `pnpm lint` and the relevant `test:ember:dev` tests (run inside
the dev container — `docker compose exec ui …`), per CLAUDE.md.
