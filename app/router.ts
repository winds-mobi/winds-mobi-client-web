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
});
