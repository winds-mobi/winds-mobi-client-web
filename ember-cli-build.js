'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { compatBuild } = require('@embroider/compat');

module.exports = async function (defaults) {
  const { setConfig } = await import('@warp-drive/build-config');
  const { buildOnce } = await import('@embroider/vite');
  let app = new EmberApp(defaults, {});

  setConfig(app, __dirname, {
    // WarpDrive/EmberData settings go here (if any)
  });

  return compatBuild(app, buildOnce);
};
