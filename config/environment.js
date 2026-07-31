'use strict';

module.exports = function (environment) {
  const ENV = {
    modulePrefix: 'winds-mobi-client-web',
    environment,
    rootURL: '/',
    locationType: 'history',
    // The release workflow sets APP_VERSION to the pushed git tag (e.g.
    // "v0.19.5"), which is also the CHANGELOG.md heading for that release
    // and a real git ref on GitHub. Unset outside that workflow -- local
    // builds and PR-preview builds are not tied to a release.
    version: process.env.APP_VERSION || 'unreleased',
    EmberENV: {
      EXTEND_PROTOTYPES: false,
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. EMBER_NATIVE_DECORATOR_SUPPORT: true
      },
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    // here you can enable a production-specific feature
  }

  return ENV;
};
