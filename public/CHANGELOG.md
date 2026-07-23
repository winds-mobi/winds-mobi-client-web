# Changelog

## Unreleased

### Changed

- The nearby-list thumbnail version of the wind-direction graph now always shows the N/E/S/W compass labels (in a fixed-width font so they line up evenly) instead of hiding all labels.

## v0.19.1 - 2026-07-23

### Changed

- The last-hour wind-direction graph is now anchored to the last recorded reading instead of the current time, so a station that has gone quiet still shows its full window (previously the graph would empty out as real time drifted past stale data). The most recent reading now sits on the outer ring, with older readings spreading in towards the center. A station with only one reading in the window now draws it as a full spoke from center to edge so its direction stays visible.

## v0.19.0 - 2026-07-21

### Added

- **🧪 Beta:** The refresh button's arrow now plays a quick one-off spin every time a refresh starts — whether you pressed the button, it refreshed on its own, or anything else triggered it — giving immediate feedback even when the refresh itself finishes almost instantly. A new "Spin the refresh button when refreshing" setting (on by default, shown once beta features are enabled) turns it off if you'd rather not. The existing continuous spin while data is actually loading is unchanged.

### Changed

- **🧪 Beta:** Favourites now has its own "Favourites" setting (on by default, shown once beta features are enabled) instead of being tied only to the "Enable beta features" toggle. Every individual beta feature's toggle now lives together with the master toggle in one grouped settings card, with the master toggle always shown first.
- Compact station cards (Nearby and Favourites) now show the same wind arrow used on the map side by side with the existing wind-direction history graph — giving an at-a-glance read on speed, gusts, and direction. The name, altitude, and last-updated time now share a single line, with the updated time shown as a terser "5m" instead of "5m ago" to save space. The cards themselves are a bit bigger.
- Map markers now shrink as you zoom out, so they no longer dwarf the map when viewing a whole region.
- On the wind chart, when zoomed out far enough that Highcharts groups several readings into one point, the gusts line now shows the highest gust in the group instead of an average, so peak gusts stay visible.

### Fixed

- Fixed map, search, nearby, and favourites requests being sent twice: the client was missing a trailing slash that made the API respond with a redirect on every call.
- Time-series charts (wind, air) now show times in your local timezone instead of UTC.
- Fixed old bookmarked/shared links (e.g. the pre-rebuild `/stations/...` URLs) showing a blank page with a console error — they now redirect to the map instead.
- Pressing refresh very soon after the last one (within 15s, down from 30s) is now more likely to actually pick up new data.
- Fixed the installed app's service worker intercepting the API docs, admin, and account-management pages (served by other backends, not this app) and wrongly showing the map instead.
- Fixed the wind-direction history graph occasionally drawing a line that jumps backwards in time, making the path look tangled or nonsensical.

## v0.18.0 - 2026-07-15

### Added

- The Help page now has an FAQ section explaining why the app was rebuilt, whether it feels different, and why the map no longer costs anything to run.

### Fixed

- Fixed the production build so installed/home-screen PWA assets resolve their paths correctly, regardless of the CDN URL used to serve the app's other assets.

## v0.17.0 - 2026-07-11

### Changed

- Updated the app's icon set (Phosphor) to its latest release — icons throughout the interface pick up the refreshed glyph designs.

## v0.16.0 - 2026-07-10

### Added

- **🧪 Beta:** Settings now has a toggle for smaller, compact favourite-station cards, matching the existing nearby-stations toggle.

### Changed

- The nearby view's card-size toggle has moved into Settings — pick bigger or smaller cards there instead of switching on the nearby screen itself.
- Refreshed the Help page: shorter, more concise descriptions throughout, corrected privacy notes about favourites, and added the missing Favourites and Settings overview sections.

## v0.15.0 - 2026-07-10

### Added

- A Discord link and QR code on the Help page's About section, for questions, bug reports, and feature requests — the Repository link remains for developers.

## v0.14.0 - 2026-07-10

### Changed

- **🧪 Beta:** Favouriting a station no longer requires signing in — starring a station now saves it directly in this browser, so favourites work right away and stay put across visits on this device. The favourite icon on the station panel is now a heart instead of a star.

### Removed

- **🧪 Beta:** Removed sign-in with Google or Facebook and the account menu, introduced in v0.13.0. Favourites no longer depend on a winds.mobi profile.

## v0.13.0 - 2026-07-09

### Added

- **🧪 Beta:** Sign in with your Google or Facebook account from the new account menu in the top bar. Signing in connects the app to your winds.mobi profile; your avatar and name appear in the menu while signed in.
- **🧪 Beta:** A new Favourites view in the navigation shows the favourite stations from your profile as live cards — the same format as the nearby view — auto-refreshing with the rest of the app and always in your profile's order.
- **🧪 Beta:** A star on the station panel header lets you add or remove that station from your favourites while signed in.
- **🧪 Beta:** A new "Enable beta features" toggle in Settings (off by default) reveals the three items above.

### Changed

- Each preference in Settings now sits in its own card, making the grouping clearer at every screen width.

### Fixed

- Turning off 3D mode now flattens the map back to a top-down view instead of leaving it tilted.

## v0.12.0 - 2026-06-25

### Added

- A locate button (crosshair icon) now appears in the top bar next to the refresh button. Tap it to find your current position — the map flies to it and a pulsing blue dot marks your location. The button outline turns blue and the icon fills in while your location is known.
- On return visits where you have previously granted location access, the map automatically centres on your position when it loads.

## v0.11.1 - 2026-06-25

### Fixed

- The "Mean" wind speed in the "Last hour" card now shows the arithmetic mean of the hour's readings instead of the median. The two values look similar for steady winds but can diverge when the wind was gusty or variable.

## v0.11.0 - 2026-06-24

### Changed

- The refresh button in the top bar now spins for as long as station data is actually loading — whether from a manual refresh, the automatic refresh, or panning/zooming the map to a new area — instead of playing a fixed one-off spin on each click.

### Fixed

- The map now loads wind stations across the whole visible area. The requested region was sized for a fixed ~1024px-wide map regardless of your screen, so on larger or wider maps stations near the edges weren't fetched until you panned toward them.

## v0.10.0 - 2026-06-23

### Changed

- Map and terrain tiles are now cached very aggressively in the browser (up to a year) once you've seen them, so panning back over a previously-viewed area no longer re-downloads the same tiles.

## v0.9.0 - 2026-06-23

### Changed

- Reverted the map's base layer back to the Swiss OpenStreetMap Association's tiles (the v0.8.0 switch to a worldwide vector basemap is reverted, along with the hillshading/contour-line layers added for it): the Swiss tiles already render hillshading and contour lines, so the added layers were redundant, and the map is back to Switzerland coverage with the simpler, original setup for now.

## v0.8.0 - 2026-06-22

### Changed

- The map's base layer now uses [OpenFreeMap](https://openfreemap.org/)'s free, worldwide vector basemap instead of a Switzerland-only raster tile server, so the map now shows the whole world, not just Switzerland.

### Added

- The map now shows hillshading and contour lines with elevation labels, generated in the browser from the same elevation data already used for the 3D terrain view, making it more usable for outdoor/free-flight planning.

## v0.7.22 - 2026-06-21

### Added

- A new "Use icons for labels" setting: when on, each value in the "Now" and "Last hour" cards shows a small icon instead of its text label.

### Changed

- Reverted the "Last hour" card's minimum/mean/maximum wind speeds back to three separate labelled rows, undoing the earlier single-line layout.
- The "Now" card's row spacing now matches "Last hour"'s tighter spacing.
- The "Now" card's wind speed metric is now labelled "Wind" instead of "Speed".
- Restored the clock icon next to the "updated" relative time in the station header and compact nearby cards.

## v0.7.21 - 2026-06-21

### Fixed

- Fixed a bug where a station's temperature, humidity, rain, and pressure could flash into view and then disappear moments later when opening its detail panel. The map's background station-list refresh (which only needs wind speed/direction) was wholesale-overwriting the richer reading the panel had just loaded for the same station.

## v0.7.20 - 2026-06-21

### Added

- The "Last hour" wind-direction chart's points now show gusts too: the outline stays the wind-speed colour, and the center switches to the gusts colour only when gusts fall in a different wind band, matching the map marker's outline/hub convention.

### Fixed

- Fixed a console error ("Invalid value for `<rect>` attribute y=NaN") that could occur on stations with sparse or gapped history data, by disabling the chart accessibility module that ember-highcharts loads by default.

## v0.7.19 - 2026-06-21

### Changed

- Hovering a "Last hour" min/mean/max icon now shows a tooltip naming it (Minimum/Mean/Maximum).
- The "Last hour" wind-direction chart's hover tooltip now shows each sample's wind speed instead of its temperature, since this is a wind chart.

## v0.7.18 - 2026-06-21

### Changed

- The "Last hour" min/mean/max row now spreads its values evenly across the card's width instead of clustering them in the centre, only the numbers are coloured by wind speed (the icons stay a neutral grey), and the value text now matches the size used in the "Now" card's speed/gusts/direction values.

## v0.7.17 - 2026-06-21

### Removed

- Removed the "Sync wind & air graphs" setting and the matching Sync toggle in the station detail panel. The feature could leak a previously viewed station's time range into the next station's wind/air graphs, causing them to occasionally open on the wrong time window instead of the default last 6 hours; removing it restores the reliable default.

## v0.7.16 - 2026-06-21

### Changed

- The "Last hour" min/mean/max row now uses clearer line-style arrow icons (arrow-line-down, arrows-in-line-vertical, arrow-line-up) instead of plain arrows and a crosshair.

## v0.7.15 - 2026-06-21

### Changed

- The "Last hour" card's minimum/mean/maximum wind speeds are now a single compact row (min / mean / max, each marked with a small icon instead of a text label) rather than three separate labelled rows, with the km/h unit shown once at the end.

## v0.7.14 - 2026-06-21

### Changed

- The "last updated" colour fade now steps through Fibonacci-spaced ages (1/2/3/5/8/13/21/34/55 minutes) before going flat grey past 55 minutes, instead of the previous evenly-bunched minute steps.

## v0.7.13 - 2026-06-21

### Changed

- The "last updated" colour fade now resolves entirely within the first hour (steps at 1/2/4/7/12/20/35/60 minutes), with anything older than an hour shown as flat grey, instead of stretching the gradient out to 24 hours.

## v0.7.12 - 2026-06-21

### Added

- The Help page now shows the "Data freshness colours" legend, explaining how the gold-to-grey colour of a station's "updated" time maps to how old the reading is.

## v0.7.11 - 2026-06-21

### Changed

- The "last updated" colour fade now starts with a brighter, more vivid gold for just-in readings, instead of the previous muted dark gold.

## v0.7.10 - 2026-06-21

### Changed

- The "last updated" gold-to-grey colour fade now has finer steps in the first 10-40 minutes (matching the app's 2-minute refresh cycle), so the fade is visible across nearby stations instead of nearly all of them landing on the same dark-gold colour.

## v0.7.8 - 2026-06-21

### Changed

- The temperature value in the station detail sidebar's "Now" card is now coloured with the same violet-to-red scale used by the `Air` history chart, instead of plain text.
- The "Now" card's value widgets (wind speed, gusts, direction, temperature, humidity, pressure, rain) are now single-line and more compact, with the label on the left and the value right-aligned, instead of stacking the label above the value.

## v0.7.7 - 2026-06-21

### Added

- The "last updated" relative time in the station header and compact nearby cards is now coloured from dark gold (just updated) fading to grey as the reading ages, matching the grey already used for stale (24h+) map markers.

## v0.7.6 - 2026-06-21

### Changed

- Removed the clock icon next to the "last updated" relative time in the station header and compact nearby cards, leaving just the time text.

## v0.7.5 - 2026-06-21

### Changed

- Relative "last updated" minutes now show as "5m ago" (matching hours/days/etc.) instead of "5 min ago".

## v0.7.4 - 2026-06-21

### Changed

- Relative "last updated" times (in the station detail header and compact nearby cards) now use shorter unit abbreviations, e.g. "5 min ago" and "2h ago" instead of "5 minutes ago" and "2 hours ago".

## v0.7.3 - 2026-06-21

### Changed

- The compact nearby-stations grid now always shows at least two columns, even on the narrowest phone screens, instead of collapsing to a single column.

## v0.7.2 - 2026-06-21

### Changed

- On compact nearby cards, the wind speed/gusts line now sits above the wind-direction thumbnail in the right column instead of in the left text column, keeping it visually grouped with the direction it describes.

## v0.7.1 - 2026-06-21

### Changed

- Compact nearby cards now show wind speed and gusts as a single "speed / gusts km/h" line (speed shown larger) instead of two separate labeled rows, and only peak (take-off site) stations show a mountain icon next to their altitude — other stations show altitude with no icon, on both the compact cards and the station header.

## v0.7.0 - 2026-06-21

### Added

- The Nearby stations view now has a "Smaller cards" toggle (also available in Settings) that shows a denser grid of compact cards — name, altitude, wind, gusts, last update, and a small wind-direction thumbnail — so more stations fit on screen without scrolling.

### Changed

- Refreshed the top navigation bar: the desktop menu now centers across the full available width, the search box is a compact fixed-width field instead of stretching on mobile, and the refresh and mobile-menu buttons are simpler icon-only controls with a consistent height.

## v0.6.2 - 2026-06-20

### Fixed

- The previous fix for the selected station's highlight ring could hide its arrow entirely on the map. The arrow now always stays visible while neighbouring stations still take priority for clicks where markers overlap.

## v0.6.1 - 2026-06-20

### Fixed

- The highlight ring around a selected station marker now fits closer to its arrow and no longer overlaps nearby stations' arrows, so they stay easy to click.

## v0.6.0 - 2026-06-18

### Changed

- Shareable map links now use clearer `longitude`/`latitude`/`zoom` web-address parameters (previously `mapLng`/`mapLat`/`mapZoom`). Map links you bookmarked or shared before this release will open the default view instead of the saved one — re-share or re-bookmark them to capture the new format.
- Clicking a station marker on the map now opens its detail panel without moving the map, rather than always recentering on it. Click the station's name in the panel if you want to center the map on it.

### Fixed

- Choosing a page from the mobile menu could occasionally reload the whole app instead of navigating within it; it now always navigates in place.

## v0.5.0 - 2026-06-18

### Added

- A new "Make old data's arrows smaller" setting (on by default) shrinks each station's wind arrow the older its last reading is, so fresh stations stand out and stale ones recede. Arrows scale down evenly from full size now to half size at 30 minutes and never shrink below half, and you can turn it off in Settings.

### Changed

- Station wind arrows now have a rounder, chubbier shape with a clean black hairline outline, making them friendlier and easier to read on the map. The gust reading is shown by filling the arrow's centre circle with the gust's wind-band colour — but only when the gusts reach a higher wind-speed colour band than the average, so the centre lights up only when it adds information. (The setting is now "Highlight gusts in the arrow centre".)

### Fixed

- When the map opens centered on your location, it now draws straight there instead of animating a pan and zoom in from the country-wide view.
- Clicking a station on the map now smoothly pans so it's centered in the map area beside the detail panel, instead of often staying off to the side.

## v0.4.0 - 2026-06-17

### Added

- A station's name is now a link: click it — in the detail panel or in a nearby-station card — to open that station on the map, zoomed in to it.
- A new Settings page (reachable from the menu on desktop and mobile) lets you customise the interface, with a live preview of each option beside it. You can choose whether the browser tab shows the selected station, whether wind gusts are drawn as an arrow outline on the map, and whether station graphs start synced. Your choices are saved in this browser.
- The browser tab icon now becomes the selected station's wind arrow — coloured by wind speed and gusts, rotated to the wind direction, and shaped for peaks — so an open station's latest reading is visible at a glance even from another tab. Closing the station restores the default icon.

### Changed

- Wind arrows on the map now keep pointing at true compass directions when you rotate the map, and lie flat on the terrain when you tilt into 3D, instead of staying fixed to the screen and pointing the wrong way.
- The currently selected navigation item is now clearly highlighted with a solid background on both the desktop top bar and the mobile menu, so it's obvious which page you're on.
- The navbar search results now appear in a single clean panel (previously two overlapping boxes with mismatched rounded corners), and the search field placeholder is shortened to "Search".
- Station search now favors stations near you when your location is already known, so the closest matches rise to the top instead of results being ranked by name alone (your location is never requested just to search).

## v0.3.0 - 2026-06-16

### Changed

- Stations on a peak now stand out: map markers use a distinct arrow shape, and the altitude line in the station detail and nearby views shows a mountain icon (a location pin for other stations).

## v0.2.0 - 2026-06-15

### Changed

- The map now starts centered on your location when it is available, showing a large area around you; when location is unavailable it opens on the whole of Switzerland instead of always jumping to a fixed region around Interlaken on a new tab or refresh.

## v0.1.0 - 2026-04-05

### Added

- Added a shared station search directly in the navbar so you can quickly find a station by name on both mobile and desktop and jump straight to its map detail.

### Changed

- Updated station search results to show the station name together with distance from you and the current wind speed, making it easier to choose the right match before opening it.
- Updated station search selection so choosing a result recenters the map on that station at zoom level `10` with a smooth animated map move, while keeping the resulting map position in the URL for reloads and sharing.
- Refined the navbar search field with a rounded pill style, a binoculars search icon, and clearer focus, loading, and keyboard-navigation states so it reads as a primary navbar control on both mobile and desktop.
- Refined the `Last hour` wind-direction chart so the compass labels sit in a more natural position around the graph instead of feeling too tight to the center.

### Fixed

- Fixed map view syncing so selecting a search result, opening a station, or panning keeps the map, the shareable URL, and the visible stations in step without redundant re-centering or stalls.
- Fixed the mobile menu so choosing `Map`, `Nearby`, or `Help` closes the drawer again after the navigation was reworked.

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
