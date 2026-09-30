import EmberRouter from '@ember/routing/router';
import config from 'winds-mobi-client-web/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('map', function () {
    this.route('station', { path: '/:station_id' });
  });
  this.route('nearby');
  this.route('favorites');
  this.route('hidden');
  this.route('settings');
  this.route('help');
  this.route('not-found', { path: '/*path' });
});
