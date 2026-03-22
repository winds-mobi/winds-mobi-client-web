# AGENTS.md

## Repo-first AI workflow

- Keep long-lived AI context in this repository. Treat this file as the canonical reference.
- If an AI tool supports project knowledge uploads, upload this file there and re-upload it when it changes.
- Keep detailed, versioned instructions in the repo instead of only in a tool UI.
- Use `ember-mcp` for Ember best practices. Upstream reference:

```text
https://github.com/ember-tooling/ember-mcp/blob/main/.github/copilot-instructions.md?plain=1
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
- For app code in `app/**`, prefer Warp Drive builders + `this.store.request(...)` + handlers over ad hoc `fetch()`.
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
- Run `pnpm test` before finishing a substantial change when dependencies are available.
- Useful targeted commands: `pnpm lint:format`, `pnpm lint`, `pnpm test:ember`.
