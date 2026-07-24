# TODO

## Exploratory

- **Render map station markers as native MapLibre GL layers instead of per-station DOM
  markers.** Where it lives: `app/components/map/station-marker.gts` (the marker itself)
  and `app/components/map/index.gts` (the `{{#each this.stations as |station|}}` /
  `<map.marker>` loop). Problem: today each station is a real DOM element
  (`<map.marker>`'s `domContent` div) repositioned via JS/CSS `transform` on every map
  frame; that's one HTML node + CSS transform per station (currently capped at 470 by
  `mapQuery`), and it's the same category of "DOM element with its own transform, stacked
  on top of MapLibre's own transformed marker element" that turned out to cause the
  mobile click-reliability bug fixed alongside this TODO entry. A `GeoJSONSource` +
  `symbol`/`circle` layer setup (see MapLibre's own layer/source components,
  `ember-maplibre-gl`'s `<map.source>`/`<source.layer>`) renders all stations as vector
  data on the WebGL canvas instead, with MapLibre's own feature-click hit-testing (pure
  GPU raycasting, no DOM/CSS-transform involved at all) replacing per-marker DOM click
  handling entirely, and scales far better than one DOM node per station. Proposed fix:
  not a quick swap -- would need (1) pre-rasterizing the two arrow shapes
  (`public/images/arrow-not-peak.svg`/`arrow-peak.svg`) into recolorable SDF sprites
  (`map.addImage(..., {sdf: true})`) instead of drawing the SVG paths directly, (2)
  moving per-station rotation/color/scale from the current Ember getters
  (`station-marker.gts`'s `markerColor`/`markerScale`/`markerTransform`) into precomputed
  GeoJSON feature properties consumed via `icon-rotate`/`icon-color`/`icon-size`
  expressions, (3) a separate filtered layer (or paint expression) for the gusts hub and
  the selection ring. Worth prototyping as a throwaway spike first (confirm SDF
  recoloring + rotation actually looks right) before committing to the full rewrite.

Dev-environment cleanup audit (2026-07-11). Baseline for comparison: the stock
`ember-cli` 6.3.1 app blueprint + `@ember/app-blueprint` (Vite) overlay, TypeScript
variant. Each section below is worked as one focused commit that also removes its
section; sections under "Assessed — no change" are recorded findings, not work items.

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
