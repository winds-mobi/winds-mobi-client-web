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
- Keep imperative DOM or third-party library integration in modifiers.
- For app code in `app/**`, prefer Warp Drive builders + `this.store.request(...)` + handlers over ad hoc `fetch()`.
- Prefer existing Frontile and Tailwind patterns for shared UI.
- Update `translations/en-us.yaml` when UI text changes.
- Do not edit generated or installed files such as `dist/` or `node_modules/`.

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
