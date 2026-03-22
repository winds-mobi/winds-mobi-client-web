import Service from '@ember/service';
import { module, test } from 'qunit';
import { currentURL, settled, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { createFakeMapRuntime } from 'winds-mobi-client-web/tests/helpers/fake-map-runtime';
import {
  resetMapRuntimeForTest,
  setMapRuntimeForTest,
} from 'winds-mobi-client-web/utils/map-runtime';
import { Type } from '@warp-drive/core/types/symbols';
import type { Station } from 'winds-mobi-client-web/services/store';

type FakeRuntime = ReturnType<typeof createFakeMapRuntime>;

type FakeStoreRequest = {
  url?: string;
};

type MapQueryParamsTestContext = {
  fakeRuntime: FakeRuntime;
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

  hooks.beforeEach(function (this: MapQueryParamsTestContext) {
    const fakeRuntime = createFakeMapRuntime();

    this.fakeRuntime = fakeRuntime;

    this.owner.register('service:store', FakeStoreService);
    setMapRuntimeForTest(fakeRuntime.runtime);
  });

  hooks.afterEach(function () {
    resetMapRuntimeForTest();
  });

  test('it uses the URL view for the initial map and station request', async function (this: MapQueryParamsTestContext, assert) {
    const fakeRuntime = this.fakeRuntime;
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');

    assertCurrentMapUrl(assert, {
      mapLat: '46.54321',
      mapLng: '8.12345',
      mapZoom: '9.5',
    });
    assert.deepEqual(fakeRuntime.maps[0]?.options.center, [8.12345, 46.54321]);
    assert.strictEqual(fakeRuntime.maps[0]?.options.zoom, 9.5);
    assert.true(
      store.calls.some(
        (url) =>
          url.includes('near-lat=46.54321') && url.includes('near-lon=8.12345')
      )
    );
  });

  test('it does not refetch stations for tiny map view changes', async function (this: MapQueryParamsTestContext, assert) {
    const fakeRuntime = this.fakeRuntime;
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');

    const initialStationRequestCount = countStationRequests(store.calls);

    fakeRuntime.maps[0]?.setView([8.12844, 46.5482], 9.6);
    fakeRuntime.maps[0]?.emit('moveend');

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

  test('it refetches stations after the request threshold is crossed', async function (this: MapQueryParamsTestContext, assert) {
    const fakeRuntime = this.fakeRuntime;
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');

    const initialStationRequestCount = countStationRequests(store.calls);

    fakeRuntime.maps[0]?.setView([8.14345, 46.54321], 9.5);
    fakeRuntime.maps[0]?.emit('moveend');

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
});
