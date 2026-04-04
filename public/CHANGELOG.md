# Changelog

## v0.0.22 - 2026-04-04

### Changed

- Sharpened the generated app icons so the windsock artwork fills more of the icon canvas, which makes installed home-screen icons look crisper on phones and tablets.
- Added explicit Apple touch icons in `152x152`, `167x167`, and `180x180` sizes so iPhone and iPad home-screen installs can use a size that better matches the device.

## v0.0.20 - 2026-04-04

### Changed

- Refined the mobile map layout so landscape phones now show station details beside the map instead of below it, with more stable full-height behavior when rotating the device and a side panel sized to `min(32rem, 50vw)`.
- Tightened the chart presentation by trimming extra horizontal gutter in the history graphs and keeping polar-chart label scaling focused on very small sizes without shrinking chart heights or active controls, so the station graphs use their space more efficiently.
- Reworked the wind legend into a more compact horizontal layout and ordered it from lower to higher wind speeds so it takes less room on the map and reads more naturally.
- Refreshed the app branding assets so the favicon, app icons, and navbar logo reflect the winds.mobi color palette more clearly.
- Strengthened the `v2.winds.mobi` wordmark in the navbar with larger, bolder black text so the app name reads as a primary brand element without an extra badge background.

## v0.0.19 - 2026-04-02

### Changed

- Streamlined station history loading so the `Last hour`, `Wind`, and `Air` graphs update more efficiently and consistently when switching between stations.
- Updated the `Last hour` wind-direction tooltip so each point now shows the sample time together with the matching temperature.

### Fixed

- Fixed station details so provider links now appear reliably the first time a station sidebar opens, instead of sometimes only showing up only after reopening or switching stations.

## v0.0.18 - 2026-04-02

### Changed

- Refined the desktop navbar so the refresh action now sits directly with the main navigation as a compact icon button, while the mobile drawer keeps a full-width labeled refresh button.
- Simplified the refresh action presentation by removing the extra countdown and hover title text, and added a subtle one-shot spin animation on the refresh icon when you trigger a manual refresh.
- Trimmed the map station payload further so provider details are loaded only when opening a station, keeping the initial map data leaner.

### Fixed

- Fixed station details so provider links now appear reliably the first time a station sidebar opens, instead of sometimes only showing up after reopening or switching stations.
- Fixed station sidebar provider links so they now appear only when a complete provider link is available, avoiding empty or incomplete provider entries while station details are still loading.

## v0.0.17 - 2026-04-01

### Changed

- Refined the map chrome alignment so the wind legend and map loading badge now sit flush with the same top and left offset as the built-in map controls.
- Tightened the desktop navbar spacing so the logo, navigation, and refresh action align more cleanly with the map view below.
- Simplified the shared refresh action to a standard outlined button, keeping a compact square icon button in the desktop navbar and a full-width labeled button in the mobile menu drawer.

## v0.0.16 - 2026-03-26

### Changed

- Refined the navigation with shared menu icons across desktop and mobile, a clearer pill-style selected state on desktop, and a cleaner mobile drawer layout with standard full-width buttons.
- Shortened the nearby location call to action to a simpler primary button label.

### Fixed

- Fixed mobile menu navigation so choosing `Map`, `Nearby`, or `Help` closes the drawer and transitions inside the app instead of triggering a full page reload.

## v0.0.15 - 2026-03-26

### Changed

- Simplified the main navigation so desktop and mobile menus now share one set of links while each keeps its own layout and markup.
- Refined the mobile menu structure to feel more consistent and predictable when switching between the `Map`, `Nearby`, and `Help` views.

## v0.0.14 - 2026-03-25

### Added

- Added a new `Nearby` view that can use your current location to show the closest weather stations in a responsive card layout.
- Added a new `Help` page that explains the main app views, shows a live station example, documents station colours, lists data providers, and summarizes compatibility, privacy, and project contact details.
- Added the project changelog directly to the `Help` page, rendered from the bundled `CHANGELOG.md` file.

### Changed

- Added direct `Map` and `Nearby` navigation links to the navbar so switching between the two views is faster and clearer.
- Added a `Help` link to the main navigation.
- Reworked the navbar for small screens with a responsive drawer menu while keeping the refresh countdown visible in the top bar.
- Updated the `Help` page to reuse the actual shared wind legend and wind palette instead of describing a separate help-only colour system.
- Updated the new `Nearby` view to request location only when needed, show a simpler permission prompt, hide the introductory copy once nearby stations are available, and offer a direct button to load your location when it is still missing.
- Kept the shared refresh control available in the `Nearby` view so nearby station results can be refreshed manually and through the same automatic refresh cycle as the map.
- Unified station header details across the map sidebar and nearby cards so station name, altitude, relative update time, distance from you, and provider link are presented consistently.
- Updated station metadata to use clearer inline icons and proper external provider links that open in a new browser tab.
- Restored the native map geolocation control so the map now uses its built-in location button and blue user-location marker, while nearby stations and distance displays continue to use the same shared location state.
- Refined the navbar refresh countdown to use a smaller footprint in the top bar.

## v0.0.13 - 2026-03-25

### Changed

- Refined the station sidebar’s `Last hour` card so it now requests only the last hour of history directly, keeps the same layout while loading, and presents the wind-direction view and summary metrics more consistently.
- Updated the `Wind` and `Air` station sections so they each load only the historical range and fields they need, which keeps those charts more focused and efficient.
- Simplified the station sidebar cards so the `Now`, `Last hour`, `Wind`, and `Air` sections now share a single leaner card style without extra layout-specific variants.
- Refined the station history charts so each graph keeps its own time controls and bottom timeline slider, while a simple `Sync` switch lets the wind and air charts stay zoomed and panned together when you want to compare them side by side.
- Refined the navbar refresh control so it now shows elapsed time since the last refresh with a small circular progress indicator instead of a refresh icon.

### Fixed

- Fixed the `Last hour` wind summary so its middle wind value is calculated from the actual last-hour readings instead of using a simple sample average.
- Fixed the `Last hour` wind-direction chart so it now leaves a small inset around the polar graph instead of clipping the outer line against the card edge.
- Fixed station history loading so the `Last hour`, `Wind`, and `Air` sections can load different historical fields independently without overriding each other’s values.

## v0.0.12 - 2026-03-24

### Added

- Added an optional 3D terrain mode on the map, with a built-in terrain toggle, steeper default pitch, and direct rotate/pitch interactions while keeping the existing Swiss base map.

### Changed

- Changed map station arrows so their fill still shows wind speed while the outline now uses the wind-gust colour scale.
- Shortened the automatic map and station refresh cycle to 2 minutes and made the refresh countdown update every second.
- Refined station time displays across the app so refresh countdowns and station timestamps use clearer relative wording with automatic seconds, minutes, and hours.
- Updated the wind and air history charts to restore the quick time-range buttons, keep 6 hours as the default view, remove the date-entry fields, and show cleaner whole-number tooltip values.
- Updated the wind and air history charts to use 24-hour time with a short weekday on a second x-axis line for easier reading.

### Fixed

- Fixed chart interactions so the wind and air history range buttons work more reliably without getting stuck in a stale selected state.
- Fixed the station history cache so readings from different stations no longer overwrite each other when they share the same timestamp.
- Fixed the last-hour wind-direction chart so it now behaves as a proper polar time view, with clearer quarter-hour rings, a more stable layout, and cleaner connected points.

## v0.0.11 - 2026-03-24

### Added

- Added a clearer refresh control in the navbar with a standard refresh icon and a countdown that says when the next automatic refresh will happen.

### Changed

- Simplified map behavior so the shared URL remains the source of truth for the initial map view while the app avoids unnecessary station reloads for tiny map changes.
- Simplified the refresh-control presentation so it now looks like a standard button instead of a custom-drawn control.
- Updated relative-time wording across the refresh countdown and station sidebar to use clearer units such as seconds, minutes, and hours automatically instead of a timer-style display.
- Added the station altitude next to the latest reading time in the station sidebar header.
- Simplified the station sidebar timestamp text to use plain relative wording such as “x seconds ago”.
- Updated the wind and air history charts to show 24-hour time plus the short weekday on two-line x-axis labels, and restored the default selected range to 6 hours.
- Restored the quick range buttons on the wind and air history charts, removed the date input fields, and rounded tooltip values to cleaner whole numbers.
- Changed the default map opening position to a wider overview around `46.69299, 7.82667` at zoom `10.94`.

### Removed

- Removed automatic map recentering on startup, so reopening the app no longer tries to move the map on its own.

### Fixed

- Kept shared map links, station-panel deep links, manual refreshes, and automatic refreshes working consistently while the map and navbar controls were simplified.
- Fixed station-history caching so last-hour and historic readings stay isolated to the correct station even when different stations report the same timestamp.
- Fixed the last-hour wind-direction chart so it no longer breaks on initial load or when recent samples are stale or malformed.
- Fixed the last-hour wind-direction chart layout so it keeps a square shape, uses clearer quarter-hour rings, and avoids cropped compass labels.
- Fixed the navbar logo so clicking it resets the map back to the default overview instead of preserving the previous custom map URL state.

## v0.0.10 - 2026-03-22

### Changed

- Switched map station discovery from center-based `near-*` queries to viewport-based `within-*` rectangle queries, using the live MapLibre bounds while keeping center and zoom as the routed URL state.
- Trimmed the station-list payload used by the map and enabled duplicate filtering plus a much larger viewport limit so station discovery behaves more like the original app.
- Switched the production basemap to the OSM Switzerland raster tiles for a quieter overview map.
- Updated the wind history chart to reuse the shared wind-speed palette so its colors now follow the same banding scheme as map markers and summary indicators.
- Updated the air temperature chart to use explicit temperature bands from light purple through red, matching the intended cold-to-hot visual scale.
- Reversed the map wind legend so the strongest wind band now appears at the top and the weakest band at the bottom.
- Removed the custom datetime label format from the wind and air history charts so they now fall back to Highcharts' default x-axis labels.

### Fixed

- Stabilized the shared stock-chart inputs for the wind and air history charts so range-selector zoom controls no longer get reset by incidental rerenders.
- Tightened the wind history y-axis padding and tick behavior so the chart follows the actual data more closely instead of reserving unnecessary vertical headroom.
- Increased y-axis label density for the wind and air history charts so both graphs now show a clearer five-tick scale.
- Hardened shared chart-series generation by filtering invalid timestamps, coercing invalid values to `null`, deduplicating by timestamp, and sorting points by timestamp before handing them to Highcharts.

## v0.0.9 - 2026-03-22

### Added

- Added a shared map refresh control in the navbar that can manually reload nearby-station and station-detail data, resets the shared refresh cycle, and shows the remaining auto-refresh countdown as an icon-first control.

### Changed

- Added automatic map-data and station-detail refreshes on a 10-minute cycle while the map route is active, with the refresh countdown updating in the navbar at a lower 15-second cadence.
- Reworked the refresh control from a text button into a compact icon-only control with a countdown ring, and tied its lifecycle to the rendered map-navbar control instead of route event listeners.
- Refined the station summary layout with denser spacing, more compact cards, a unified single-column `Now` card for current conditions, and equal-height outer cards in the summary row.
- Tightened the wind legend presentation by replacing per-row swatches with full-row wind-colour backgrounds, shrinking the control footprint, and moving it closer to the map corner.
- Refined selected-station highlighting and marker polish after the `ember-maplibre-gl` migration, including a thicker semi-transparent grey outline and other small navbar and legend presentation adjustments.
- Unified station metric rendering around shared number formats so summary cards now receive raw values plus named formats instead of preformatted strings.
- Migrated `ember-intl` from v7 to v8, moved shared formats into app-owned `ember-intl` setup, and renamed `formatRelative` to `formatRelativeTime`.
- Wired `@ember-intl/vite` into the Vite app so translations are loaded through virtual translation modules in both the application route and test setup.
- Moved the wind-speed palette into Tailwind theme tokens and reused those named colors across summary metrics, the map legend, SVG markers, and the polar wind chart.

### Removed

- Removed the old v7-era `config/ember-intl.js` configuration file and the obsolete `app/formats.js` file as part of the `ember-intl` v8 migration.

### Fixed

- Hid summary metric cards automatically when their values are missing instead of rendering empty boxes.
- Consolidated station metric formatting for wind speed, temperature, humidity, rainfall, pressure, and azimuth into the shared metric-card component so formatting and visibility rules are applied consistently.
- Kept the active `ember-intl` integration aligned with the installed v8 package while preserving the app’s shared number-format usage and translation loading under Vite.
- Made the `Last hour` wind graph stack vertically above its metric boxes at every breakpoint and fit the available card width without extra internal inset.
- Simplified the last-hour card title from `Wind - last hour` to `Last hour`.
- Replaced Ember template `style=` bindings for wind-driven colors with safe finite Tailwind utility classes so the map legend and summary metrics no longer trigger style-binding warnings.
- Reduced unnecessary top and bottom whitespace around the wind and air history charts by tightening shared chart spacing, label layout, and section padding.
- Removed the station-panel loading skeleton placeholders while keeping the panel shell mounted during station-to-station loading transitions.
- Stabilized shared refresh behavior across map and station routes by keeping the navbar refresh service active through overlapping control lifecycles and aligning the acceptance tests with the current history-request URLs.
- Unified the outer spacing of the `Now`, `Last hour`, `Wind`, and `Air` sections by moving shared panel insets up to the station container instead of letting each section pad itself differently.

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

### Fixed

- Tightened the migrated map request flow around typed `store.request(...)` access, explicit ignored router/task promises, and application-test owner typing so the current map path passes lint cleanly.

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
