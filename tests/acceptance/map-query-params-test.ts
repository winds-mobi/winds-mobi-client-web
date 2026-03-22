import Service from '@ember/service';
import { module, test } from 'qunit';
import type { Map as MaplibreMap } from 'ember-maplibre-gl';
import {
  click,
  currentURL,
  settled,
  visit,
  waitUntil,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
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

function currentMap(): MaplibreMap | undefined {
  const element = document.querySelector('[data-test-map-canvas]');

  return (
    element as
      | (Element & {
          __maplibreMap?: MaplibreMap;
        })
      | null
  )?.__maplibreMap;
}

async function mapInstance() {
  await waitUntil(() => Boolean(currentMap()));

  const map = currentMap();

  if (!map) {
    throw new Error('Expected map instance to be available');
  }

  return map;
}

async function moveMapTo(longitude: number, latitude: number, zoom: number) {
  const map = await mapInstance();

  map.jumpTo({
    center: [longitude, latitude],
    zoom,
  });
  map.fire('moveend');
}

module('Acceptance | map query params', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('it uses the URL view for the initial map and station request', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');
    const map = await mapInstance();
    const center = map.getCenter();

    assertCurrentMapUrl(assert, {
      mapLat: '46.54321',
      mapLng: '8.12345',
      mapZoom: '9.5',
    });
    assert.strictEqual(center.lng, 8.12345);
    assert.strictEqual(center.lat, 46.54321);
    assert.strictEqual(map.getZoom(), 9.5);
    assert.true(
      store.calls.some(
        (url) =>
          url.includes('near-lat=46.54321') && url.includes('near-lon=8.12345')
      )
    );
  });

  test('it does not refetch stations for tiny map view changes', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');

    const initialStationRequestCount = countStationRequests(store.calls);

    await moveMapTo(8.12844, 46.5482, 9.6);
    await settled();

    assertCurrentMapUrl(assert, {
      mapLat: '46.5482',
      mapLng: '8.12844',
      mapZoom: '9.6',
    });
    assert.strictEqual(
      countStationRequests(store.calls),
      initialStationRequestCount
    );
  });

  test('it refetches stations after the request threshold is crossed', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');

    const initialStationRequestCount = countStationRequests(store.calls);

    await moveMapTo(8.14345, 46.54321, 9.5);
    await settled();

    assertCurrentMapUrl(assert, {
      mapLat: '46.54321',
      mapLng: '8.14345',
      mapZoom: '9.5',
    });
    assert.strictEqual(
      countStationRequests(store.calls),
      initialStationRequestCount + 1
    );
    assert.true(
      store.calls.some(
        (url) =>
          url.includes('near-lat=46.54321') && url.includes('near-lon=8.14345')
      )
    );
  });

  test('it force refreshes stations from the navbar button', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');

    const initialStationRequestCount = countStationRequests(store.calls);

    assert.dom('[data-test-navbar-refresh]').exists();
    assert.dom('[data-test-navbar-refresh-countdown]').hasText('10:00');

    await click('[data-test-navbar-refresh]');
    await settled();

    assert.strictEqual(
      countStationRequests(store.calls),
      initialStationRequestCount + 1
    );
    assert.dom('[data-test-navbar-refresh-countdown]').hasText('10:00');
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
});
