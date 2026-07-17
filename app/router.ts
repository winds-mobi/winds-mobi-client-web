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
  // TODO: Remove login — the auth-callback route backs the disabled sign-in
  // feature (see app/services/session.ts). Restore alongside it.
  // this.route('auth-callback', { path: '/auth/callback' });
  this.route('settings');
  this.route('help');
  this.route('not-found', { path: '/*path' });
});
