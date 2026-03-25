import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, currentURL, visit, waitUntil } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type { Station } from 'winds-mobi-client-web/services/store';

type FakeStoreRequest = {
  url?: string;
};

const STATION_FIXTURES: Station[] = [
  {
    id: 'holfuy-1804',
    altitude: 1804,
    latitude: 46.67719,
    longitude: 7.86323,
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
];

class FakeStoreService extends Service {
  calls: string[] = [];
  private requestCache = new Map<
    string,
    Promise<{ content: { data: Station[] } }>
  >();

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';
    this.calls.push(url);

    let cachedRequest = this.requestCache.get(url);

    if (!cachedRequest) {
      cachedRequest = Promise.resolve({
        content: {
          data: STATION_FIXTURES,
        },
      });
      this.requestCache.set(url, cachedRequest);
    }

    return cachedRequest;
  }
}

class ShortIntervalMapRefreshService extends MapRefreshService {
  refreshIntervalMs = 75;
  countdownTickMs = 10;
}

const NAVBAR_LOCATION_SELECTOR = '[data-test-navbar-location]';

function countStationRequests(calls: string[]) {
  return calls.filter((url) => url.includes('/stations?')).length;
}

function assertCurrentMapUrl(
  assert: Assert,
  expectedQueryParams: Record<string, string>
) {
  const url = new URL(currentURL(), 'https://winds.mobi');

  assert.strictEqual(url.pathname, '/map');
  assert.deepEqual(
    Object.fromEntries(url.searchParams.entries()),
    expectedQueryParams
  );
}

module('Acceptance | map query params', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('it uses the URL view for the initial map and station request', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');
    await waitUntil(() => countStationRequests(store.calls) > 0);

    assertCurrentMapUrl(assert, {
      mapLat: '46.54321',
      mapLng: '8.12345',
      mapZoom: '9.5',
    });
    assert.true(
      store.calls.some(
        (url) =>
          url.includes('within-pt1-lat=') &&
          url.includes('within-pt1-lon=') &&
          url.includes('within-pt2-lat=') &&
          url.includes('within-pt2-lon=') &&
          url.includes('is-highest-duplicates-rating=true') &&
          url.includes('limit=470')
      )
    );
  });

  test('it force refreshes stations from the navbar button', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');
    await waitUntil(() => countStationRequests(store.calls) > 0);

    const initialStationRequestCount = countStationRequests(store.calls);

    assert.dom('[data-test-navbar-refresh]').exists();
    assert
      .dom('[data-test-navbar-refresh]')
      .hasAttribute(
        'title',
        'Refresh map and station data (00:00 since last refresh)'
      );
    assert.dom('[data-test-navbar-refresh]').hasText('00:00');

    await click('[data-test-navbar-refresh]');

    assert.strictEqual(
      countStationRequests(store.calls),
      initialStationRequestCount + 1
    );
    assert
      .dom('[data-test-navbar-refresh]')
      .hasAttribute(
        'title',
        'Refresh map and station data (00:00 since last refresh)'
      );
    assert.dom('[data-test-navbar-refresh]').hasText('00:00');
  });

  test('it auto refreshes stations after the refresh interval', async function (assert) {
    this.owner.register('service:map-refresh', ShortIntervalMapRefreshService);

    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');

    const initialStationRequestCount = countStationRequests(store.calls);

    await waitUntil(
      () => countStationRequests(store.calls) > initialStationRequestCount
    );

    assert.true(
      countStationRequests(store.calls) >= initialStationRequestCount + 1
    );
  });

  test('it recenters the map from the shared navbar location button', async function (assert) {
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
        accuracy: 20,
        latitude: 46.54321,
        longitude: 8.12345,
      };
    };

    await visit('/map?mapLng=7.82667&mapLat=46.69299&mapZoom=9.5');

    assert.dom(NAVBAR_LOCATION_SELECTOR).exists();

    await click(NAVBAR_LOCATION_SELECTOR);

    await waitUntil(
      () =>
        currentURL().includes('mapLat=46.54321') &&
        currentURL().includes('mapLng=8.12345')
    );

    assertCurrentMapUrl(assert, {
      mapLat: '46.54321',
      mapLng: '8.12345',
      mapZoom: '12',
    });
  });
});
