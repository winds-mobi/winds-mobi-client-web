# winds-mobi-client-web

The web client for [winds.mobi](https://winds.mobi) — a live map of wind/weather
stations for free-flight (paragliding/hang-gliding) pilots. It renders a MapLibre
map of stations with real-time readings, per-station detail panels with Highcharts
time series, a geolocation-backed nearby view, favourites, and search.

Built with Ember 6 (Octane, `.gts`/TypeScript), Vite + Embroider, Warp Drive /
EmberData, Frontile, and Tailwind CSS v4.

## Community

Questions, bug reports, and feature requests are welcome on our
[Discord server](https://discord.gg/6VU23xDv5v) — it's the easiest way to get help or discuss
ideas if you're not comfortable with GitHub.

If you're a developer, please use [GitHub Issues](https://github.com/winds-mobi/winds-mobi-client-web/issues)
instead, so bugs and feature requests stay tracked alongside the code.

## Prerequisites

You will need the following things properly installed on your computer.

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) (exact versions are
  pinned in `package.json`'s `engines`/`packageManager`)
- [Google Chrome](https://google.com/chrome/) (for running tests)

Alternatively, use the dev container: `docker compose up -d` builds and starts a
container (service `ui`) with the pinned Node/pnpm and its own `node_modules`,
running `pnpm start` as its entrypoint. Run project commands inside it with
`docker compose exec ui <cmd>`.

## Installation

- `git clone <repository-url>` this repository
- `cd winds-mobi-client-web`
- `pnpm install`

## Running / Development

- `pnpm start`
- Visit your app at [http://localhost:4200](http://localhost:4200).
- Visit your tests at [http://localhost:4200/tests](http://localhost:4200/tests).

### Running Tests

- `pnpm test` — lint plus the full test suite
- `pnpm test:ember` — isolated test build + run
- `pnpm test:ember:dev` — run tests against an already-running `pnpm start` dev server
- `pnpm test:ember:dev:server` — interactive Testem session against the dev server

### Linting

- `pnpm lint`
- `pnpm lint:fix`

### Building

- `pnpm ember build` (development)
- `pnpm build` (production)

### Deploying

Pushing a `v*.*.*` tag triggers the GitHub Actions workflow
[build-deploy-production.yml](.github/workflows/build-deploy-production.yml), which
builds the production bundle and rsyncs `dist/` to the winds.mobi server.

## Further Reading / Useful Links

- [ember.js](https://emberjs.com/)
- [ember-cli](https://cli.emberjs.com/release/)
- Development Browser Extensions
  - [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  - [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)
