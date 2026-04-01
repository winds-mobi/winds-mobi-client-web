import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import { loadTranslations } from '@ember-intl/vite';
import { VitePWA } from 'vite-plugin-pwa';

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
  server: {
    allowedHosts: ['ui.winds-mobi-client-web.orb.local'],
    hmr: hmrClientConfig(),
  },
  plugins: [
    classicEmberSupport(),
    ember(), // extra plugins here
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
    loadTranslations(),
    tailwindcss(),
    mode === 'production'
      ? VitePWA({
          registerType: 'autoUpdate',
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
          },
        })
      : null,
  ].filter(Boolean),
  optimizeDeps: {
    exclude: ['ember-page-title', 'object-inspect', 'embroider-util'],
  },
}));
