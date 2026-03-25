import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, visit, waitUntil } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type { History, Station } from 'winds-mobi-client-web/services/store';

type FakeStoreRequest = {
  url?: string;
};

const STATION_FIXTURES: Station[] = [
  {
    id: 'holfuy-1804',
    altitude: 1804,
    latitude: 46.521,
    longitude: 6.632,
    isPeak: false,
    providerName: 'Holfuy',
    providerUrl: 'https://example.com/stations/holfuy-1804',
    name: 'Holfuy 1804',
    last: {
      timestamp: 1_710_000_000_000,
      direction: 240,
      speed: 12,
      gusts: 18,
      temperature: 7,
      humidity: 65,
      pressure: 1012,
      rain: 0,
    },
    [Type]: 'station',
  },
  {
    id: 'holfuy-2222',
    altitude: 2222,
    latitude: 46.53,
    longitude: 6.64,
    isPeak: true,
    providerName: 'Holfuy',
    providerUrl: 'https://example.com/stations/holfuy-2222',
    name: 'Holfuy 2222',
    last: {
      timestamp: 1_710_000_000_000,
      direction: 220,
      speed: 20,
      gusts: 28,
      temperature: 3,
      humidity: 58,
      pressure: 1008,
      rain: 0,
    },
    [Type]: 'station',
  },
];

const HISTORY_FIXTURES: History[] = [
  {
    id: 'holfuy-1804:1710000000',
    direction: 240,
    speed: 12,
    gusts: 18,
    temperature: 7,
    humidity: 65,
    rain: 0,
    timestamp: 1_710_000_000_000,
    [Type]: 'history',
  },
];

class FakeStoreService extends Service {
  calls: string[] = [];

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    this.calls.push(url);

    if (url.includes('/historic/')) {
      return Promise.resolve({
        content: {
          data: HISTORY_FIXTURES,
        },
      });
    }

    return Promise.resolve({
      content: {
        data: STATION_FIXTURES,
      },
    });
  }
}

class ShortIntervalMapRefreshService extends MapRefreshService {
  refreshIntervalMs = 75;
  countdownTickMs = 10;
}

function countStationRequests(calls: string[]) {
  return calls.filter((url) => !url.includes('/historic/')).length;
}

module('Acceptance | nearby route', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('it shows the explainer and waits for the location button when access is not granted yet', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;
    const nearbyLocation = this.owner.lookup(
      'service:nearby-location'
    ) as NearbyLocationService;

    nearbyLocation.syncPermissionState = async () => {
      nearbyLocation.permissionState = 'prompt';
    };

    await visit('/nearby');

    assert.dom('[data-test-nearby-location-prompt]').exists();
    assert.dom('[data-test-nearby-enable-location]').hasText('Use my location');
    assert.strictEqual(countStationRequests(store.calls), 0);
  });

  test('it requests location after the user enables it and then loads nearby stations', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;
    const nearbyLocation = this.owner.lookup(
      'service:nearby-location'
    ) as NearbyLocationService;

    nearbyLocation.syncPermissionState = async () => {
      nearbyLocation.permissionState = 'prompt';
    };
    nearbyLocation.requestCurrentPosition = async () => {
      nearbyLocation.permissionState = 'granted';
      nearbyLocation.requestState = 'ready';
      nearbyLocation.coordinates = {
        accuracy: 25,
        latitude: 46.521,
        longitude: 6.632,
      };
    };

    await visit('/nearby');
    await click('[data-test-nearby-enable-location]');

    await waitUntil(
      () =>
        document.querySelectorAll('[data-test-nearby-station-card]').length === 2
    );

    assert.dom('[data-test-nearby-location-prompt]').doesNotExist();
    assert.dom('[data-test-nearby-station-card]').exists({ count: 2 });
    assert.dom('[data-test-station-distance]').exists({ count: 2 });
    assert.true(countStationRequests(store.calls) > 0);
  });

  test('it skips the button when geolocation permission is already granted', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;
    const nearbyLocation = this.owner.lookup(
      'service:nearby-location'
    ) as NearbyLocationService;

    nearbyLocation.syncPermissionState = async () => {
      nearbyLocation.permissionState = 'granted';
      nearbyLocation.requestState = 'ready';
      nearbyLocation.coordinates = {
        accuracy: 20,
        latitude: 46.521,
        longitude: 6.632,
      };
    };

    await visit('/nearby');
    await waitUntil(
      () =>
        document.querySelectorAll('[data-test-nearby-station-card]').length === 2
    );

    assert.dom('[data-test-nearby-location-prompt]').doesNotExist();
    assert.dom('[data-test-nearby-enable-location]').doesNotExist();
    assert.dom('[data-test-nearby-station-card]').exists({ count: 2 });
    assert.true(countStationRequests(store.calls) > 0);
  });

  test('it keeps the refresh button visible and refreshes nearby stations', async function (assert) {
    this.owner.register('service:map-refresh', ShortIntervalMapRefreshService);

    const store = this.owner.lookup('service:store') as FakeStoreService;
    const nearbyLocation = this.owner.lookup(
      'service:nearby-location'
    ) as NearbyLocationService;

    nearbyLocation.syncPermissionState = async () => {
      nearbyLocation.permissionState = 'granted';
      nearbyLocation.requestState = 'ready';
      nearbyLocation.coordinates = {
        accuracy: 20,
        latitude: 46.521,
        longitude: 6.632,
      };
    };

    await visit('/nearby');
    await waitUntil(
      () =>
        document.querySelectorAll('[data-test-nearby-station-card]').length === 2
    );

    const initialStationRequestCount = countStationRequests(store.calls);

    assert.dom('[data-test-navbar-refresh]').exists();

    await click('[data-test-navbar-refresh]');

    await waitUntil(
      () => countStationRequests(store.calls) > initialStationRequestCount
    );

    assert.true(countStationRequests(store.calls) > initialStationRequestCount);
  });
});
