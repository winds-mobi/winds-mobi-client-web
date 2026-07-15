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
              /^\/admin/,
              /^\/django-static/,
            ],
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
