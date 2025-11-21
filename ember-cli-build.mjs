// ember-cli-build.mjs (ESM variant)
import EmberAppDefault from 'ember-cli/lib/broccoli/ember-app.js';
import { compatBuild } from '@embroider/compat';
import { setConfig } from '@warp-drive/core/build-config';
import { buildOnce } from '@embroider/vite';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default function (defaults) {
  const app = new EmberAppDefault(defaults, {
    babel: {
      plugins: [
        require.resolve('ember-concurrency/async-arrow-task-transform'),
      ],
    },
  });

  setConfig(app, new URL('.', import.meta.url).pathname, {
    compatWith: '4.12',
    deprecations: {},
  });

  return compatBuild(app, buildOnce);
}
