# Changelog

## v0.0.7 - 2026-03-22

### Added

- Added a routed station-detail experience on top of the map, including direct station selection, map recentering, and a responsive station sidebar.
- Added richer station summary content with wind and air metrics, compact shared metric cards, and improved chart presentation.
- Added a compact wind-speed legend and clearer map marker states, including selected-marker outlines and grey markers for stale readings older than 24 hours.
- Added broader test coverage for map query params, station-panel behavior, map runtime integration, and marker logic.

### Changed

- Migrated the interactive map stack away from the previous Leaflet-based approach to a MapLibre + deck.gl setup with shared map runtime utilities.
- Reworked station details from a tabbed drawer flow into a stacked, card-based sidebar that works across desktop and mobile layouts.
- Refined chart sizing, polar wind-chart labels, marker rendering, sidebar separators, and the map centering control for a more coherent UI.

### Fixed

- Normalized station timestamps so freshness calculations and stale-marker rendering behave correctly.
- Replaced deprecated Ember service injection imports and tightened project guidance around service usage.
- Cleaned up lint-related issues that surfaced during the map and station-panel work.

## v0.0.6 - 2025-11-20

### Changed

- Modernized the app and toolchain.

## v0.0.5 - 2025-10-02

### Added

- Added Vite PWA support.
- Added Docker and dev-container support.
- Added `lint-to-the-future`.

### Changed

- Refreshed PWA assets and updated related Vite setup.
- Switched test execution from Chrome to Chromium.

### Fixed

- Fixed Chromium sandbox issues in tests.
- Fixed build, lint, and ignore-file issues around the new tooling.
- Removed leftover `ember-web-app` pieces and other obsolete setup.

## v0.0.4 - 2025-05-28

### Fixed

- Fixed pnpm store and package-manager configuration issues.
- Relaxed install flow around frozen lockfiles to get the workspace installing cleanly again.

## v0.0.3 - 2025-05-28

### Fixed

- Applied formatting fixes to get lint back into a passing state.

## v0.0.2 - 2025-05-28

### Added

- Reinitialized the app around the Embroider app blueprint with pnpm and GTS route work.

### Changed

- Moved the build stack toward Embroider and Vite-era tooling.
- Upgraded or adjusted Tailwind v4, Highcharts, Frontile, and related dependencies.
- Reworked routing and component setup during the migration.

### Fixed

- Fixed a long list of compatibility issues around Ember Data, Warp Drive, ember-leaflet, Sharp, imports, and build configuration.
- Restored packages and routes that were temporarily removed during the migration.
- Cleaned up configs, formatting, and assorted dependency shims.

## v0.0.1 - 2025-04-21

### Added

- Initial map-based weather station experience.
- Added GPS centering, a “you are here” marker, and station refresh on map movement.
- Added station details, tabs, historical charts, polar wind visualizations, and relative-time display.
- Added Tailwind, Frontile overlays, app icons, and GitHub Actions deployment for built assets.

### Changed

- Introduced builders, handlers, and schema-based data shaping for station and history data.
- Iterated heavily on charting, map arrows, drawer layout, navbar structure, and overall UI polish.

### Fixed

- Fixed API fetching, production behavior, location handling, owner typings, translations, and many early layout/chart issues.
