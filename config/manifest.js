'use strict';

module.exports = function (/* environment, appConfig */) {
  // See https://zonkyio.github.io/ember-web-app for a list of
  // supported properties

  return {
    name: 'winds.mobi client-web',
    short_name: 'winds.mobi',
    description:
      'Paraglider pilot, kitesurfer, check real-time weather conditions of your favorite spots on your smartphone, your tablet or your computer.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [],
    ms: {
      tileColor: '#fff',
    },
  };
};
