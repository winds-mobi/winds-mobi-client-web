# AGENTS.md

## Repo-first AI workflow

- Keep long-lived AI context in this repository. Treat this file as the canonical reference.
- If an AI tool supports project knowledge uploads, upload this file there and re-upload it when it changes.
- Keep detailed, versioned instructions in the repo instead of only in a tool UI.
- Use `ember-mcp` for Ember best practices. Upstream reference:

```text
https://github.com/ember-tooling/ember-mcp/blob/main/.github/copilot-instructions.md?plain=1
```

- Use the WarpDrive LLM docs for request/state patterns and `<Request>` usage:

```text
https://warp-drive.io/llms-full.txt
```

## Project overview

- This repository is a single Ember application at the repo root.
- Stack: Ember Octane/Polaris-style app, GTS/TypeScript, Vite + Embroider, Warp Drive, Frontile, Tailwind CSS v4, pnpm.
- Translations live in `translations/en-us.yaml`.

## Repo layout

- `app/components`, `app/templates`, `app/routes`, `app/controllers`: UI and route structure.
- `app/services`, `app/helpers`, `app/modifiers`, `app/utils`: shared application logic.
- `app/builders` and `app/handlers`: Warp Drive request builders and response shaping.
- `tests/unit`, `tests/integration`, `tests/acceptance`: test coverage.

## Working conventions

- Prefer simple, typed Ember code. Assume configuration, declared dependencies, and API payloads are correct unless there is a proven issue.
- If a requested implementation appears to require hacks, brittle workarounds, or patterns that cut against Ember or app architecture, push back clearly and explain why it does not seem like the best practice before proceeding.
- Keep imperative DOM or third-party library integration in modifiers.
- Do not add app initializers, bundler alias tricks, or other startup-time hacks just to force third-party libraries into a working state. Prefer normal package upgrades or supported integration points, and stop to discuss before adding that kind of workaround.
- For `ember-highcharts`, treat `highcharts` as a real app dependency and keep it current instead of relying on a transitive peer version. If wind/air stock-chart range selector buttons break, suspect Highcharts module/version mismatches first and prefer upgrading `highcharts` and `ember-highcharts` before adding app-side loading workarounds.
- Do not add component arguments as speculative override points when the app has no real call sites for them.
- If a component has an internal default and no actual external callers pass an override, remove the argument instead of keeping a "future-proof" escape hatch.
- Do not add trivial passthrough getters just to feed translated strings or other direct template values into child components. Prefer helpers like `{{t ...}}` directly in the template when no class logic is needed.
- Prefer Tailwind responsive classes for layout changes. Do not add component arguments or class logic just to switch layout variants across breakpoints.
- For station sections split into a WarpDrive `<Request>` wrapper and a data presenter, keep them in a subdirectory with `index.gts` for the fetcher and `presenter.gts` for the view.
- Do not add test-only override seams to app components just to make them easier to unit or integration test. Prefer smaller real tests, and skip a test rather than complicating the production API.
- Do not add DOM hacks, exposed instance handles, or other special production code just so tests can reach inside a component or third-party library. DOM selectors in tests are fine; production test hooks and escape hatches are not. If a test would require that kind of seam, skip or replace the test instead.
- Do not call `ember-intl` `formatRelativeTime` directly in app UI code. Use the shared `time-ago` helper, or `renderTimeAgoText` in TypeScript, so relative-time wording stays consistent and automatically switches between seconds, minutes, hours, and larger units.
- Keep `CHANGELOG.md` user-facing. Document shipped behavior, visible improvements, and notable fixes. Do not list internal refactors, test-only changes, or implementation details unless they directly affect users.
- When async state coordination fits `ember-concurrency`, prefer it over manual timer or promise bookkeeping. If newer `ember-concurrency` syntax or APIs would require installing or upgrading the package, stop and tell the user first. When using `ember-concurrency`, prefer the latest package version and its current syntax over legacy patterns.
- For app code in `app/**`, prefer Warp Drive builders + `this.store.request(...)` + handlers over ad hoc `fetch()`.
- When narrowing historical station requests with `keys`, keep the section-specific field needs aligned with the current UI:
  - `app/components/station/last-hour/index.gts`: `w-dir`, `w-avg`, `w-max`
  - `app/components/station/wind/index.gts`: `w-dir`, `w-avg`, `w-max`
  - `app/components/station/air/index.gts`: `temp`, `hum`, `rain`
- Warp Drive supports partial resource payloads via upsert, but only one level deep. Reusing the same `history` identity with different top-level primitive fields is fine as long as the handler only emits attributes that were actually present in the payload; do not normalize omitted fields to `undefined`, and do not rely on partial deep merges for object-valued fields.
- Prefer existing Frontile and Tailwind patterns for shared UI.
- Update `translations/en-us.yaml` when UI text changes.
- Do not edit generated or installed files such as `dist/` or `node_modules/`.

## Services

- Use services for cross-cutting, long-lived application concerns such as data access, geolocation, routing coordination, or shared session-like state.
- Do not put route- or component-local UI state in services. Prefer component state, route models, and query params for things like open drawers, selected tabs, and map view.
- Keep service APIs small and explicit. Consumers should call service methods or tasks instead of mutating service state ad hoc.
- There are only two valid `@ember/service` import patterns in app code:
  - `import Service from '@ember/service'` when defining a service class.
  - `import { service } from '@ember/service'` when injecting a service into a route, component, controller, helper, or modifier.
- Never import `inject` from `@ember/service`, including `inject as service`.
- Use `@tracked` or tracked-built-ins for reactive service state, and prefer `ember-concurrency` tasks for async workflows when they fit.
- Add service registry typings with `declare module '@ember/service' { interface Registry { ... } }` for every app service.
- Do not use services as generic event buses or dumping grounds for unrelated state.

## Commits

- Do not create commits or push changes unless explicitly asked.
- If asked to create a commit, use:
  - a random emoji as the first character of the subject line
  - a short subject line describing the intent
  - a commit body with `Why:`, `How:`, and `Notes:`

Example:

```text
✨ Add map query param state

Why: Keep map view shareable and stable across refreshes.
How: Move center and zoom into route query params and sync them through the map modifier.
Notes: Leaflet-specific state was removed from the location service.
```

## Verification

- Install dependencies with `pnpm install`.
- Use the smallest relevant checks while working.
- Do not run lint or tests after every small change. Batch work, then run the relevant verification before push.
- Before pushing, run lint and the relevant tests for the changes being shipped.
- Useful targeted commands: `pnpm lint:format`, `pnpm lint`, `pnpm test:ember`.
- If a local Vite dev server is already running and the goal is local verification without disrupting it, prefer `pnpm test:ember:dev` over `pnpm test:ember`. Keep `pnpm test:ember` for isolated build-based verification and CI-style checks.
