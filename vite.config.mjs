import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import { loadTranslations } from '@ember-intl/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { stationArrows } from './build/vite-plugin-station-arrows.mjs';

const DEFAULT_APP_URL = 'http://127.0.0.1:4200';

function hmrClientConfig() {
  const appURL = new URL(process.env.APP_URL || DEFAULT_APP_URL);
  const protocol = appURL.protocol === 'https:' ? 'wss' : 'ws';
  const port = appURL.port || (appURL.protocol === 'https:' ? '443' : '80');

  return {
    clientPort: Number(port),
    protocol,
  };
}

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? process.env.CDN_URL || '/' : '/',
  server: {
    allowedHosts: ['ui.winds-mobi-client-web.orb.local'],
    hmr: hmrClientConfig(),
  },
  plugins: [
    classicEmberSupport(),
    ember(), // extra plugins here
    stationArrows(),
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
    loadTranslations(),
    tailwindcss(),
    mode === 'production'
      ? VitePWA({
          // Deliberately '/', not CDN_URL (see PR #107): the service worker
          // itself, registerSW.js, and manifest.webmanifest must stay
          // same-origin with the page (winds.mobi/Caddy) -- a service worker
          // can only be registered from the same origin as the document that
          // registers it, so pointing this at the CDN breaks registration
          // outright. Vite's own `base` (above) already sends the real JS/CSS
          // bundle and pwaAssets' icon links to the CDN independently of this
          // option. What this `base` leaves wrong is the precache manifest
          // Workbox builds below -- see the `modifyURLPrefix` comment.
          base: '/',
          registerType: 'autoUpdate',
          pwaAssets: {
            config: true,
            includeHtmlHeadLinks: true,
          },
          includeAssets: ['favicon.ico', 'icons/pwa-*/**/*.png'], // include generated icons
          manifest: {
            name: 'winds.mobi',
            short_name: 'winds.mobi',
            start_url: '/',
            scope: '/',
            display: 'standalone',
            background_color: '#ffffff',
            theme_color: '#4E9805',
            icons: [
              {
                src: 'pwa-64x64.png',
                sizes: '64x64',
                type: 'image/png',
              },
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: 'maskable-icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
          workbox: {
            navigateFallback: '/index.html',
            maximumFileSizeToCacheInBytes: 8000000,
            // Ignore paths that are managed by Caddy reverse proxy backends.
            // https://github.com/winds-mobi/winds-mobi-config/blob/main/winds.mobi/Caddyfile
            navigateFallbackDenylist: [
              /^\/api/,
              /^\/user/,
              /^\/admin/,
              /^\/django-static/,
            ],
            // `base: '/'` above (needed to keep the service worker itself
            // same-origin) means Workbox's own asset scan builds the precache
            // manifest with root-relative URLs for everything, including the
            // hashed JS/CSS bundle -- but that bundle is actually served from
            // CDN_URL in production (Vite's real `base`, set at the top of
            // this file), not from winds.mobi. Left alone, the precache list
            // points at a copy of the bundle that exists (rsync also deploys
            // dist/ to Caddy) but that the page never actually requests, so
            // every first visit downloads the app twice: once from the CDN to
            // render, once more in the background to satisfy this precache.
            // `modifyURLPrefix` rewrites just these two prefixes -- the
            // hashed bundle (`assets/`) and Embroider's virtual entry chunks
            // (`@embroider/virtual/`), the only precache entries actually
            // fetched from the CDN by the real page -- to match. `index.html`,
            // `registerSW.js`, `manifest.webmanifest`, and the PWA icon files
            // are deliberately left root-relative: they're served from Caddy
            // (registerSW.js's own SW registration call must be, per the
            // comment on `base` above), and rewriting entries with no
            // matching prefix here is a no-op, so this can't touch them.
            ...(process.env.CDN_URL && {
              modifyURLPrefix: {
                'assets/': `${process.env.CDN_URL}assets/`,
                '@embroider/virtual/': `${process.env.CDN_URL}@embroider/virtual/`,
              },
            }),
            runtimeCaching: [
              {
                // Base raster map tiles (tile.osm.ch/switzerland): roads/labels
                // barely change, so cache aggressively rather than re-fetching
                // tiles the user has already panned/zoomed past once.
                urlPattern: /^https:\/\/tile\.osm\.ch\//,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'map-base-tiles',
                  expiration: {
                    maxEntries: 8000,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                // AWS Terrarium terrain DEM tiles: elevation data is static.
                urlPattern:
                  /^https:\/\/s3\.amazonaws\.com\/elevation-tiles-prod\//,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'map-terrain-tiles',
                  expiration: {
                    maxEntries: 4000,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                // Issue #143 item 5: answer instantly from the last session's
                // cached response while refetching in the background, so the
                // map has something to show before the network round-trip
                // completes. roundBoundsForRequest (app/utils/map-view.ts)
                // snaps map bounds to a grid, so reopening the same view is a
                // byte-identical URL and should cache-hit; the existing
                // 2-minute map-refresh poll then picks up whatever the
                // background revalidation fetched. maxAgeSeconds mirrors
                // STALE_STATION_COLOUR's 24h "this station has gone quiet"
                // threshold in station-arrow.ts, so the SW stops treating a
                // response as usable at the same point the UI already calls a
                // reading stale on its own. Safety gate: every reading
                // already carries its own last.timestamp, and the
                // per-station "updated Xm ago" text/marker dimming
                // (reading-freshness.ts, station-arrow.ts) is driven off
                // that timestamp, not off when the request happened -- so a
                // cache hit here still shows correctly stale-looking data,
                // not falsely-fresh data.
                urlPattern: /^https:\/\/winds\.mobi\/api\/2\.3\/stations/,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'stations-api',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24,
                  },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
            ],
          },
        })
      : null,
  ].filter(Boolean),
  optimizeDeps: {
    exclude: [
      'ember-page-title',
      'object-inspect',
      'embroider-util',
      // @frontile/collections' Table component fails to prebundle: its
      // precompiled templates reference `get`/`or` outside strict-mode scope,
      // and a `@frontile/theme/src/tw.json` import esbuild can't resolve. We
      // only use Listbox from this package, never Table, but Vite's forced
      // dependency scan (`vite --force`, our dev script) still crawls the
      // whole package and crashes the optimizer on it, breaking nearly every
      // route on a fresh dev-server start (see TROUBLESHOOTING.md).
      // Excluding it from prebundling defers resolution to per-module
      // request time, where the unused Table component is never reached.
      '@frontile/collections',
    ],
  },
}));
