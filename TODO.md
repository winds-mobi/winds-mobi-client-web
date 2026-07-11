# TODO

Dev-environment cleanup audit (2026-07-11). Baseline for comparison: the stock
`ember-cli` 6.3.1 app blueprint + `@ember/app-blueprint` (Vite) overlay, TypeScript
variant. Each section below is worked as one focused commit that also removes its
section; sections under "Assessed — no change" are recorded findings, not work items.

## 1. Drop `--force` from `pnpm start`

- **Where:** `package.json` → `"start": "vite --host 0.0.0.0 --force"`.
- **Problem:** stock is plain `vite`. `--host 0.0.0.0` is a justified deviation (the
  container must listen on all interfaces). `--force` is not: it throws away Vite's
  dependency-optimization cache and re-scans every dependency on every boot.
- **Why:** slower boots forever, to guard against a rare one-time condition; worse,
  [TROUBLESHOOTING.md](TROUBLESHOOTING.md)'s own 504 root-cause analysis identifies the
  forced full re-scan as the thing that turns a stale `node_modules` volume into a fully
  dead dev server. Vite already re-optimizes automatically when the lockfile or config
  changes, so the flag buys nothing in the normal case.
- **How:** remove `--force`. When a corrupt optimize-deps cache is actually suspected,
  run `pnpm start --force` ad hoc (pnpm forwards extra flags to vite), or
  `rm -rf node_modules/.vite` per TROUBLESHOOTING.md.
- **Expected effect:** faster container boots, one fewer crash amplifier, closer to stock.

## 2. Remove `postinstall: npm rebuild sharp`

- **Where:** `package.json` → `"postinstall": "npm rebuild sharp"`.
- **Problem:** the only `npm` invocation in a repo otherwise pinned to pnpm
  (`packageManager`, `engines`, corepack in the Dockerfile). It's also redundant:
  `pnpm-workspace.yaml` already lists `sharp` under `onlyBuiltDependencies`, so pnpm
  runs sharp's native build itself during `pnpm install`.
- **Why:** mixing package managers is exactly the class of drift this audit is removing;
  stock blueprint has no `postinstall` at all. The script dates to early "sharp issues"
  fire-fighting (`e5928db`) that predates the `onlyBuiltDependencies` allowlist.
- **How:** delete the script. Verify inside the container: `pnpm rebuild sharp` succeeds
  and `node -e "require('sharp')"` loads.
- **Expected effect:** pnpm-only toolchain, slightly faster installs, one less non-stock
  script line.

## 3. Stock-parity touch-ups in package.json

- **Where:** `package.json`.
- **Problem:** two small drifts from the stock blueprint:
  - `"lint:js": "eslint ."` — stock is `eslint . --cache` (`.eslintcache` is already
    gitignored here, so the cache was clearly intended at some point).
  - `description`/`repository` are still blueprint boilerplate ("Small description for
    winds-mobi-client-web goes here", `""`).
- **How:** add `--cache`; fill in a real one-line description and the GitHub repository
  URL. Leave `license`/`author` untouched (licensing is a maintainer decision).
- **Expected effect:** faster repeat lints; `package.json` stops advertising itself as an
  unedited blueprint.

## 4. Remove unused `lint-to-the-future` devDependencies

- **Where:** `package.json` devDependencies: `lint-to-the-future`,
  `lint-to-the-future-eslint`, `lint-to-the-future-ember-template`.
- **Problem:** nothing references them — no script, no config, no `.lint-todo`
  directory. They were added during an old lint-migration push (CHANGELOG line 594) whose
  workflow was never adopted; meanwhile the whole suite lints clean, so there is nothing
  to "ignore now, fix later".
- **How:** `pnpm remove` the three packages (run in the container so its `node_modules`
  volume and the lockfile stay in sync).
- **Expected effect:** three fewer dependencies to install/audit; dependency list closer
  to stock.

## 5. Dockerfile: drop global ember-cli, fix stage comments

- **Where:** `Dockerfile` base stage: `RUN pnpm add -g ember-cli`; comments
  "Stage 1 / Stage 3 / Stage 4" over three actual stages.
- **Problem:** the global install pulls whatever the *latest* ember-cli is at image-build
  time — unpinned, drifting, and shadowed anyway: every script path (`pnpm ember`,
  `pnpm exec ember`, `test:ember`) resolves the pinned local devDependency
  (`ember-cli@~6.3.1`) first. The stage numbering is leftover from a deleted stage.
- **How:** delete the `pnpm add -g` line; renumber the comments. Verify with
  `docker compose build`.
- **Expected effect:** reproducible image (no unpinned latest), smaller layer, honest
  comments.

## 6. Docs no longer match reality (CLAUDE.md + TROUBLESHOOTING.md)

- **Where:** `CLAUDE.md` Commands + Testing sections; `TROUBLESHOOTING.md` blank-page
  section.
- **Problem:** recent fixes made several passages actively wrong:
  - CLAUDE.md still says `pnpm lint` does **not** run ESLint and recommends
    `npx eslint <files>` — `lint:js` was wired in and all 121 errors fixed (`cd6fcdd`);
    the lint gate now covers ESLint in CI.
  - CLAUDE.md still warns that `pnpm test:ember` in the container corrupts the live dev
    server and demands a container restart afterwards — the permanent fix
    (`EMBROIDER_WORKING_DIRECTORY=node_modules/.embroider-test` isolating the test
    build) is applied and verified; the hazard is gone for the script itself.
  - TROUBLESHOOTING.md's "Prevention — this is the systemic fix" section likewise still
    prescribes "never run it / restart immediately" instead of describing the applied fix.
  - Two dangling "see TODO.md" references (OAuth/JWT flow; map-refresh WebGL note) point
    at content deleted in `d334234`.
- **How:** rewrite those passages to describe the current state (keeping the diagnostic
  content — it's good archaeology); inline the WebGL/map-idle fact instead of pointing at
  TODO.md; note login is disabled (`TODO: Remove login` in the authenticator). Add two
  small policy lines while in there: (a) pnpm only — never `npm`/`npx`; use `pnpm <script>`
  or `pnpm exec <bin>` so nothing gets network-installed on demand; (b) after a lint
  failure, run `pnpm lint:fix` first and hand-fix only what autofix can't (some rules,
  e.g. `no-useless-escape`, have no fixer).
- **Expected effect:** guidance stops contradicting the repo; future sessions stop
  restarting containers and hand-fixing autofixable lint errors for no reason.

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
