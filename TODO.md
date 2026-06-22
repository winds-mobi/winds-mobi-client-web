# TODO

## Map tile provider analysis (launch readiness)

> Context: non-commercial project, no revenue taken, possibly NGO-backed, but we
> do **not** want to pay to run the service. Currently in "build & demo" phase.
> Goal: a worldwide basemap we can run sustainably for ~free at real traffic.

### 1. What we use today

> **Status update:** the base layer has since been migrated to **OpenFreeMap**
> (Option A below) in [app/components/map/index.gts](app/components/map/index.gts).
> The table below documents the original "build & demo" setup this analysis was
> written against.

Originally defined in [app/components/map/index.gts](app/components/map/index.gts) as `OSM_SWISS_STYLE`:

| Layer       | Source                                                                    | Provider                                                    | Coverage             |
| ----------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------- |
| Base raster | `https://tile.osm.ch/switzerland/{z}/{x}/{y}.png`                         | **Swiss OpenStreetMap Association (SOSM)** community server | **Switzerland only** |
| Terrain DEM | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` | **AWS Terrain Tiles** (ex-Mapzen, AWS Open Data)            | Worldwide            |

Two things to flag before any launch:

- **The base map is Switzerland-only.** `tile.osm.ch/switzerland/...` is a regional
  extract. "Display a map of anywhere in the world" is **not** possible with the
  current source — this must change regardless of cost.
- **`tile.osm.ch` is a volunteer community server, not a product.** It has no
  published high-volume fair-use allowance and is funded by SOSM members. Pointing
  a public, worldwide app at it would be abusing a community resource — the same
  way the OSMF explicitly forbids heavy/commercial-scale use of
  `tile.openstreetmap.org` ([OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)).
  Fine for build/demo and a Swiss-only audience; **not** an acceptable production
  basemap. We must move off it before launch.
- The **AWS terrain DEM is fine to keep** — it's AWS Open Data (sponsored egress),
  worldwide, no key, no per-request bill.

### 2. Traffic assumption used below

"1 map view per second, sustained, anywhere in the world":

- `1 × 3600 × 24 × 30 = ~2.6 million map views / month`
- Raster 256px full-screen map ≈ **10–16 tile requests per view**
  (MapTiler's own figure: [tile requests vs sessions](https://docs.maptiler.com/guides/maps-apis/maps-platform/tile-requests-and-map-sessions-compared/)).
  Mid estimate ~12 → **~31 million raster tile requests / month**
  (range ~26M–39M).
- Bandwidth: raster PNG ~20–40 KB/tile → **~0.9–1.2 TB / month** of tile data.
- If we switch to **vector** tiles instead: ~4 requests/view → ~10M requests/month,
  smaller origin egress thanks to heavy CDN caching.

Takeaway: 1 view/s sustained is **serious** traffic (~2.6M views/mo). This is well
past every commercial free tier.

### 3. Pricing of the commercial pay-per-use providers (the "if we did nothing smart" cost)

#### MapTiler — [pricing](https://www.maptiler.com/cloud/pricing/)

| Plan      | Price   | Included                                      | Overage                                  |
| --------- | ------- | --------------------------------------------- | ---------------------------------------- |
| Free      | $0      | 5,000 sessions **or** 100,000 API requests/mo | none — service pauses                    |
| Flex      | $25/mo  | 25k sessions / 500k requests                  | $2 / 1k sessions, $0.10 / 1k requests    |
| Unlimited | $295/mo | 300k sessions / 5M requests                   | $1.50 / 1k sessions, $0.08 / 1k requests |
| Custom    | quote   | negotiated                                    | enterprise                               |

- **Free tier = ~100k tile requests/month.** At our load (~31M) we'd blow through
  that in **~1 day**, then the map stops loading.
- We use **raster XYZ** tiles → MapTiler bills by **API requests**. At ~31M/mo on
  the Unlimited plan: `$295 + (31M − 5M)/1000 × $0.08 ≈ $295 + $2,080 = ~$2,375/month`.
- Switching to vector doesn't help on MapTiler — it then bills by **sessions**
  (~2.6M/mo): `$295 + (2.6M − 300k)/1000 × $1.50 ≈ ~$3,750/month`.
- **Realistic MapTiler bill at 1 view/s: ~$2,000–4,000/month.** Enterprise could
  negotiate down, but this is firmly "no" for a no-revenue project.

#### For reference (not OSM-leaning, not recommended)

- **Mapbox / Google**: same ballpark or worse; Google ~$3,600 for 10M tiles per the
  [Bonito Tech write-up](https://bonitotech.com/2024/03/19/how-we-reduced-our-mapping-costs-by-90-using-protomaps-and-cloudflare/).

**Conclusion for §3: pay-per-tile at this scale is ~thousands/month. Not viable.
We want one of the §4 options.**

### 4. The free / near-free options (recommended)

All of the genuinely-free OSM options below serve **vector** tiles, which means a
one-time app change: replace our single raster layer with a vector MapLibre style
(glyphs + sprites + layer styling). MapLibre supports this natively; it's a known,
well-trodden migration. (Stadia is the exception — it can drop in as raster.)

#### Option A — OpenFreeMap (public instance) — _easiest, $0, zero infra_

- **What**: free public vector-tile hosting of the whole planet, by Zsolt Erő.
  [openfreemap.org](https://openfreemap.org/) · [GitHub](https://github.com/hyperknot/openfreemap)
- **Why it's free for us**: explicitly _"completely free with no limits on the number
  of map views or requests… no registration, no API keys, no cookies."_ Commercial
  use is allowed too. Funded by donations; designed to be self-sustainable.
- **Cost**: **$0**, no account.
- **Coverage**: worldwide.
- **Risk**: single maintainer, donation-funded, **no SLA / no support guarantee**
  (their words). Mitigation: it's fully open-source incl. the deploy scripts and they
  publish weekly full-planet downloads — so if it ever disappears we can self-host the
  exact same thing (→ Option B) with no app change.
- **Effort**: low — point the style at their hosted style URL.

#### Option B — Self-host Protomaps PMTiles on Cloudflare R2 — _we own it, ~$0–15/mo_

- **What**: a single `.pmtiles` planet file on Cloudflare R2 + a tiny Worker.
  [Protomaps](https://protomaps.com/) · [Cloudflare deploy guide](https://docs.protomaps.com/deploy/cloudflare) ·
  [cost calculator](https://docs.protomaps.com/deploy/cost)
- **Why it's ~free for us**: **R2 has no bandwidth/egress fees** — only per-request +
  storage. A whole-planet tileset is ~100–130 GB. Real reports:
  - _"~130 GB global tileset in R2 + workers = $3/month"_
  - _"first month $1.67, next month likely $0"_
  - _"10M tile requests/month ≈ $11 on R2 vs ~$3,600 Google"_
    ([Bonito Tech](https://bonitotech.com/2024/03/19/how-we-reduced-our-mapping-costs-by-90-using-protomaps-and-cloudflare/),
    [Pinball Map](https://blog.pinballmap.com/2024/11/05/protomaps-tile-hosting/))
  - Workers free tier is 100k req/day; paid is $5/mo incl. 10M req. If we ever
    region-limit the tileset we can sit largely in R2's free tier.
- **Cost**: **~$0–15/month** even at our load; we control reliability entirely.
- **Risk**: low/medium — we run it. Need periodic planet rebuilds (or use Protomaps'
  prebuilt daily planet). Best fit if an **NGO can absorb a tiny, predictable bill**
  and we want no third-party runtime dependency.
- **Effort**: medium — one-time setup + a refresh cron.

#### Option C — VersaTiles — _FLOSS, NGO-oriented, self-host or public_

- **What**: fully FLOSS tile stack (generate / serve / render), Shortbread schema.
  [versatiles.org](https://versatiles.org/)
- **Why it's free for us**: _"no API keys, no usage fees, no tracking"_; explicitly
  aimed at _"newsrooms, NGOs, developers, and public institutions."_ Free public tiles
  or fully self-hostable.
- **Cost**: **$0** public, or self-host.
- **Risk**: smaller/newer ecosystem than Protomaps; public hosting is community-scale
  (donations encouraged). Good ideological fit for an NGO-backed project.
- **Effort**: low (public) to medium (self-host).

#### Option D — Stadia Maps free non-commercial tier — _only if we stay strictly non-commercial_

- **What**: OSM-based vector **and raster** tiles (raster = smaller app change).
  [pricing](https://stadiamaps.com/pricing/) · [limits](https://docs.stadiamaps.com/limits/) ·
  [FAQ on commercial use](https://stadiamaps.com/faqs/)
- **Why it _might_ be free for us**: free tier covers _"development, evaluation, and
  non-commercial use (including academic)."_ A genuinely non-commercial, ad-free,
  NGO-run public service is plausibly eligible — **but** their definition of commercial
  includes _"generates revenue (including via advertising)"_ and _"use by a for-profit
  organization."_ So: only if we never monetize. **Action: email them and confirm
  eligibility in writing** before relying on it.
- **Cost**: $0 if eligible; monthly-credit limits apply (verify the cap fits ~31M
  raster requests — likely needs their nonprofit/community arrangement).
- **Risk**: terms interpretation; free tier has request caps. Upside: can be a
  **drop-in raster** replacement (least code change).
- **Effort**: low.

### 5. Recommendation

1. **Now / pre-launch**: switch the base layer off `tile.osm.ch` → **OpenFreeMap
   (Option A)**. Zero cost, zero infra, worldwide, unblocks the worldwide launch.
   Keep the AWS terrain DEM as-is.
2. **If/when we want to own reliability** (NGO backing, predictable tiny budget):
   move to **self-hosted Protomaps on R2 (Option B)** — same vector style, ~$0–15/mo,
   no third-party runtime dependency. OpenFreeMap → Protomaps is a small style swap
   because both are vector.
3. **Parallel, low-effort hedge**: email **Stadia (Option D)** to see if they'll grant
   us free non-commercial/nonprofit access — if yes, it's the least code change (raster).

### 6. Follow-up tasks

- [x] Replace the inline Swiss raster style with OpenFreeMap's worldwide **vector**
      "Liberty" style URL; terrain DEM re-attached on map load. Done in
      [app/components/map/index.gts](app/components/map/index.gts)
      (`OPENFREEMAP_STYLE_URL`). Glyphs/sprites/attribution now come from the
      hosted style.
- [x] Make the basemap **outdoor-usable for free**: native MapLibre hillshade +
      browser-generated contour lines/labels (`maplibre-contour`), both derived
      client-side from the Terrarium DEM we already load — no extra tile hosting.
      In [app/components/map/index.gts](app/components/map/index.gts)
      (`addOutdoorLayers`). OpenFreeMap doesn't host contour/hillshade itself
      (OpenMapTiles schema excludes them), so this is the zero-cost route.
- [ ] Verify terrain DEM (`elevation-tiles-prod`) usage terms are fine at launch scale
      (AWS Open Data — expected yes).
- [ ] Email Stadia Maps re: non-commercial/nonprofit eligibility (hedge / raster fallback).
- [ ] Decide hosting posture: rely on OpenFreeMap public vs. self-host Protomaps/R2.
- [ ] Confirm the OpenFreeMap-provided attribution renders correctly in the
      `AttributionControl` (OSM + OpenMapTiles + OpenFreeMap).
- [ ] Consider self-hosting (Option B) before we depend on OpenFreeMap's public
      instance at production traffic, since it offers no SLA.
