import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';

export default defineConfig({
  plugins: [classicEmberSupport(), ember(), // extra plugins here
  babel({
    babelHelpers: 'runtime',
    extensions,
  }), tailwindcss()],
  optimizeDeps: {
    exclude: ['ember-leaflet', 'ember-page-title', 'object-inspect'],
  },
});
