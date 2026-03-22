import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

class FakeRouterService extends Service {
  currentRouteName = 'map';
  currentRoute = {
    queryParams: {
      mapLng: 7.85,
      mapLat: 46.68,
      mapZoom: 13,
    },
  };
  replaceCalls: unknown[] = [];

  replaceWith(args: unknown) {
    this.replaceCalls.push(args);
  }
}

class FakeLocationService extends Service {
  gps?: { latitude: number; longitude: number };

  getLocationFromGps = {
    isRunning: false,
    last: {
      value: false,
      isError: false,
    },
    perform: () => {
      this.gps = {
        latitude: 46.99,
        longitude: 7.44,
      };
      this.getLocationFromGps.last.value = true;
      return Promise.resolve(true);
    },
  };
}

module('Integration | Component | location-fetcher', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:router', FakeRouterService);
    this.owner.register('service:location', FakeLocationService);
  });

  test('it recenters the map query params after fetching gps coordinates', async function (assert) {
    await render(hbs`<LocationFetcher />`);
    await click('button');

    const router = this.owner.lookup('service:router') as FakeRouterService;

    assert.deepEqual(router.replaceCalls[0], {
      queryParams: {
        mapLng: 7.44,
        mapLat: 46.99,
        mapZoom: 13,
      },
    });
  });
});
