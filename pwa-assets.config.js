import {
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...preset,
    png: {
      compressionLevel: 9,
      quality: 100,
    },
    apple: {
      ...preset.apple,
      padding: 0.08,
    },
    maskable: {
      ...preset.maskable,
      padding: 0.12,
    },
    transparent: {
      ...preset.transparent,
      padding: 0,
    },
  },
  images: ['public/logo.svg'],
});
