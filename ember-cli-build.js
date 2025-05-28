'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { compatBuild } = require('@embroider/compat');

module.exports = async function (defaults) {
  const { setConfig } = await import('@warp-drive/build-config');
  const { buildOnce } = await import('@embroider/vite');

  let options = {
    'ember-cli-image-transformer': {
      images: [
        {
          inputFilename: 'public/images/logo.png',
          outputFileName: 'appicon-',
          convertTo: 'png',
          destination: 'assets/icons/',
          sizes: [32, 192, 280, 512],
        },
      ],
    },
  };

  let app = new EmberApp(defaults, {
    'ember-cli-babel': { enableTypeScriptTransform: true },
    babel: {
      plugins: [
        require.resolve('ember-concurrency/async-arrow-task-transform'),
      ],
    },
    ...options,
  });

  setConfig(app, __dirname, {
    // WarpDrive/EmberData settings go here (if any)
  });

  return compatBuild(app, buildOnce);
};
