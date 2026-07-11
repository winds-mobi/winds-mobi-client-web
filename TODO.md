# TODO

Dev-environment cleanup audit (2026-07-11). Baseline for comparison: the stock
`ember-cli` 6.3.1 app blueprint + `@ember/app-blueprint` (Vite) overlay, TypeScript
variant. Each section below is worked as one focused commit that also removes its
section; sections under "Assessed — no change" are recorded findings, not work items.

## 7. README: replace blueprint boilerplate

- **Where:** `README.md`.
- **Problem:** still the generated skeleton — "A short introduction of this app could
  easily go here", "Specify what it takes to deploy your app", a
  `pnpm test:ember --server` line that doesn't match our scripts, no mention of the
  devcontainer workflow that CLAUDE.md mandates.
- **How:** keep the stock structure, fill it in: one-paragraph app description, the
  devcontainer (`docker compose`) path next to the host path, correct test commands,
  actual deploy story (tag push → GitHub Actions → rsync to winds.mobi).
- **Expected effect:** README describes this project, not the blueprint.

## 8. Wire type-checking into the lint gate (`lint:types`) — OPEN, incremental

- **Where:** `package.json` scripts; whole app/tests tree.
- **Problem:** the stock TS blueprint ships `lint:types` (Glint), which the `lint:*(!fix)`
  glob then folds into `pnpm lint`. We have `@glint/ember-tsc` installed and working
  (`pnpm exec ember-tsc --noEmit`) but no script — so nothing type-checks the app outside
  the editor. Current state: **183 errors across 50 files** (top: `app/handlers/station.ts`
  17, `app/templates/settings.gts` 14, `app/templates/help.gts` 12,
  `app/services/store.ts` 9, `app/templates/nearby.gts` 8).
- **Why not now:** adding the script today instantly turns `pnpm lint` (and the CI lint
  job) red with 183 pre-existing failures. This is its own multi-session effort, like the
  ESLint one (`cd6fcdd`) was.
- **How (when worked):** burn the errors down per directory (`app/handlers`,
  `app/services`, `app/templates`, `app/components`, `tests/…`), one focused commit each;
  when the count is 0, add `"lint:types": "ember-tsc --noEmit"` — the existing glob wires
  it into `pnpm lint`/CI automatically. Do **not** add the script before the errors are
  fixed.
- **Expected effect:** type errors caught in CI instead of only in whichever editor has
  Glint running; full stock-blueprint script parity.

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
