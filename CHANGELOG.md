# Changelog

## v0.0.8 - 2026-03-22

### Added

- Added an app-owned `MapCanvas` wrapper around `ember-maplibre-gl`, along with dedicated station-marker and legend components for the active map route.

### Changed

- Replaced the custom MapLibre + deck.gl rendering stack with `ember-maplibre-gl` while keeping the existing route-driven map state, debounced nearby-station refreshes, and station-panel behavior.
- Switched station rendering from generated icon layers to declarative DOM/SVG markers that preserve wind colouring, stale-station greying, selection outlines, and directional rotation.
- Moved geolocation back into the map itself by relying on the native geolocate control instead of the previous navbar-centered GPS flow.
- Reworked the active map acceptance tests to exercise the migrated wrapper through real map instances and marker clicks rather than fake runtime plumbing.
- Tightened the in-map wind legend, restored the app name in the mobile navbar, removed stray top spacing from the wind summary card, and refined the selected-station highlight to use a thicker semi-transparent grey outline.

### Removed

- Removed the custom map modifier, runtime abstraction, layer builder, legend control factory, location service, location button component, and the obsolete deck.gl-specific tests.
- Removed direct deck.gl dependencies from the project.

## v0.0.7 - 2026-03-22

### Added

- Added a routed station-detail experience on top of the map, including direct station selection, a responsive station sidebar, richer station summary cards, and improved chart presentation.
- Added a native-style wind-speed legend control and clearer map marker states, including selected-marker outlines and grey markers for stale readings older than 24 hours.
- Added broader test coverage for map query params, station-panel behavior, debounced station refreshes, legend controls, map runtime integration, and marker logic.

### Changed

- Migrated the interactive map stack away from the previous Leaflet-based approach to a MapLibre + deck.gl setup with shared map runtime utilities.
- Reworked station details from a tabbed drawer flow into a stacked, card-based sidebar that works across desktop and mobile layouts.
- Decoupled nearby-station fetching from every visible map-view update so the URL remains the source of truth for the visible view while request refreshes are debounced and thresholded.
- Kept station selection focused on opening the station route and sidebar without recentering the map.
- Consolidated the shared Highcharts option-merging path and removed remaining one-off metric-tile styling in the active station summary path.
- Refined chart sizing, polar wind-chart labels, marker rendering, sidebar separators, and the map centering control for a more coherent UI.

### Fixed

- Kept the station panel shell mounted at its fixed mobile and desktop dimensions while switching between stations, so the layout no longer collapses during request transitions.
- Made selected station-marker outlines update reliably when switching from one station to another.
- Normalized station timestamps so freshness calculations and stale-marker rendering behave correctly.
- Cached station marker arrow SVG data URLs by rendered state to avoid regenerating identical icons during rerenders.
- Tightened the active map runtime, fake map runtime, and marker helpers around the new control and request flow.
- Refreshed the active map and station test suite to stub the store and map runtime at the right seams, aligned route assertions with current map behavior, and restored passing Ember tests and lint.
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
