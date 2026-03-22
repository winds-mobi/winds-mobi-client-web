import Service from '@ember/service';
import { Type } from '@warp-drive/core/types/symbols';
import { module, test } from 'qunit';
import {
  click,
  currentURL,
  settled,
  visit,
  waitUntil,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { createFakeMapRuntime } from 'winds-mobi-client-web/tests/helpers/fake-map-runtime';
import type { History, Station } from 'winds-mobi-client-web/services/store';
import {
  resetMapRuntimeForTest,
  setMapRuntimeForTest,
} from 'winds-mobi-client-web/utils/map-runtime';

type FakeRuntime = ReturnType<typeof createFakeMapRuntime>;

type DeferredRequest = {
  promise: Promise<{ content: { data: Station } }>;
  resolve: (value: { content: { data: Station } }) => void;
};

type FakeStoreRequest = {
  url?: string;
};

type MapStationPanelTestContext = {
  deferredSecondaryStationRequest?: DeferredRequest;
  fakeRuntime: FakeRuntime;
};

const PRIMARY_STATION: Station = {
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
};

const SECONDARY_STATION: Station = {
  id: 'holfuy-2222',
  altitude: 2222,
  latitude: 46.70719,
  longitude: 7.91323,
  isPeak: true,
  providerName: 'Holfuy',
  providerUrl: 'https://example.com/stations/holfuy-2222',
  name: 'Holfuy 2222',
  last: {
    timestamp: 1_710_003_600_000,
    direction: 280,
    speed: 20,
    gusts: 28,
    temperature: 4,
    humidity: 50,
    pressure: 1009,
    rain: 0,
  },
  [Type]: 'station',
};

const HISTORY: History[] = [
  {
    id: '1710000000',
    direction: 240,
    speed: 12,
    gusts: 18,
    temperature: 7,
    humidity: 65,
    timestamp: 1_710_000_000_000,
    [Type]: 'history',
  },
  {
    id: '1710003600',
    direction: 250,
    speed: 14,
    gusts: 20,
    temperature: 8,
    humidity: 61,
    timestamp: 1_710_003_600_000,
    [Type]: 'history',
  },
];

class FakeStoreService extends Service {
  deferredSecondaryStationRequest?: DeferredRequest;
  private requestCache = new Map<
    string,
    Promise<{ content: { data: History[] | Station | Station[] } }>
  >();

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    let cachedRequest = this.requestCache.get(url);

    if (cachedRequest) {
      return cachedRequest;
    }

    if (url.includes('/historic/')) {
      cachedRequest = Promise.resolve({
        content: {
          data: HISTORY,
        },
      });
      this.requestCache.set(url, cachedRequest);
      return cachedRequest;
    }

    if (url.includes('/stations/holfuy-1804?')) {
      cachedRequest = Promise.resolve({
        content: {
          data: PRIMARY_STATION,
        },
      });
      this.requestCache.set(url, cachedRequest);
      return cachedRequest;
    }

    if (url.includes('/stations/holfuy-2222?')) {
      if (this.deferredSecondaryStationRequest) {
        cachedRequest = this.deferredSecondaryStationRequest
          .promise as Promise<{
          content: { data: History[] | Station | Station[] };
        }>;
        this.requestCache.set(url, cachedRequest);
        return cachedRequest;
      }

      cachedRequest = Promise.resolve({
        content: {
          data: SECONDARY_STATION,
        },
      });
      this.requestCache.set(url, cachedRequest);
      return cachedRequest;
    }

    if (url.includes('/stations?')) {
      cachedRequest = Promise.resolve({
        content: {
          data: [PRIMARY_STATION, SECONDARY_STATION],
        },
      });
      this.requestCache.set(url, cachedRequest);
      return cachedRequest;
    }

    cachedRequest = Promise.resolve({
      content: {
        data: [],
      },
    });
    this.requestCache.set(url, cachedRequest);

    return cachedRequest;
  }
}

function createDeferredRequest(): DeferredRequest {
  let resolve!: (value: { content: { data: Station } }) => void;

  const promise = new Promise<{ content: { data: Station } }>(
    (resolvePromise) => {
      resolve = resolvePromise;
    }
  );

  return { promise, resolve };
}

function assertCurrentRoute(
  assert: Assert,
  expectedPathname: string,
  expectedQueryParams: Record<string, string>
) {
  const url = new URL(currentURL(), 'https://winds.mobi');

  assert.strictEqual(url.pathname, expectedPathname);
  assert.deepEqual(
    Object.fromEntries(url.searchParams.entries()),
    expectedQueryParams
  );
}

function selectStationMarker(fakeRuntime: FakeRuntime, stationIndex: number) {
  const stationsLayer = fakeRuntime.overlays[0]?.props.layers.find(
    (layer) => layer.id === 'stations'
  ) as
    | {
        props: {
          data: unknown[];
          onClick: (info: { object?: unknown }) => void;
        };
      }
    | undefined;

  if (!stationsLayer) {
    throw new Error('Expected stations layer to exist');
  }

  stationsLayer.props.onClick({
    object: stationsLayer.props.data[stationIndex],
  });
}

module('Acceptance | map station panel', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function (this: MapStationPanelTestContext) {
    const fakeRuntime = createFakeMapRuntime();

    this.fakeRuntime = fakeRuntime;
    this.deferredSecondaryStationRequest = undefined;

    this.owner.register('service:store', FakeStoreService);
    setMapRuntimeForTest(fakeRuntime.runtime);
  });

  hooks.afterEach(function () {
    resetMapRuntimeForTest();
  });

  test('it deep-links the panel and map state from the URL', async function (this: MapStationPanelTestContext, assert) {
    const fakeRuntime = this.fakeRuntime;

    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');

    assertCurrentRoute(assert, '/map/holfuy-1804', {
      mapLat: '46.67719',
      mapLng: '7.86323',
      mapZoom: '13',
    });
    assert.deepEqual(fakeRuntime.maps[0]?.options.center, [7.86323, 46.67719]);
    assert.strictEqual(fakeRuntime.maps[0]?.options.zoom, 13);
    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
    assert.dom('[data-test-station-panel]').exists();
    assert.dom('[data-test-station-summary-section]').exists();
    assert.dom('[data-test-station-wind-section]').exists();
    assert.dom('[data-test-station-air-section]').exists();
  });

  test('it closes from the explicit close button and preserves map query params', async function (this: MapStationPanelTestContext, assert) {
    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');
    await click('[data-test-station-close]');
    await waitUntil(() => currentURL().startsWith('/map?'));

    assertCurrentRoute(assert, '/map', {
      mapLat: '46.67719',
      mapLng: '7.86323',
    });
    assert.dom('[data-test-station-panel]').doesNotExist();
  });

  test('it does not close when clicking outside the panel', async function (this: MapStationPanelTestContext, assert) {
    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');
    await click('[data-test-map-container]');

    assertCurrentRoute(assert, '/map/holfuy-1804', {
      mapLat: '46.67719',
      mapLng: '7.86323',
      mapZoom: '13',
    });
    assert.dom('[data-test-station-panel]').exists();
  });

  test('it keeps the current map view when selecting another station from the map', async function (this: MapStationPanelTestContext, assert) {
    const fakeRuntime = this.fakeRuntime;

    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');
    selectStationMarker(fakeRuntime, 1);

    await waitUntil(() => currentURL().startsWith('/map/holfuy-2222?'));

    assertCurrentRoute(assert, '/map/holfuy-2222', {
      mapLat: '46.67719',
      mapLng: '7.86323',
    });
    assert.deepEqual(fakeRuntime.maps[0]?.center, {
      lng: 7.86323,
      lat: 46.67719,
    });
    assert.strictEqual(fakeRuntime.maps[0]?.zoom, 13);
    assert.dom('[data-test-station-title]').hasText('Holfuy 2222');
  });

  test('it keeps the panel shell mounted while the next station loads', async function (this: MapStationPanelTestContext, assert) {
    const fakeRuntime = this.fakeRuntime;
    const deferredRequest = createDeferredRequest();
    const store = this.owner.lookup('service:store') as FakeStoreService;

    this.deferredSecondaryStationRequest = deferredRequest;
    store.deferredSecondaryStationRequest = deferredRequest;

    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');
    selectStationMarker(fakeRuntime, 1);

    await waitUntil(() => currentURL().startsWith('/map/holfuy-2222?'));

    assert.dom('[data-test-station-panel]').exists();
    assert.dom('[data-test-station-panel-loading]').exists();
    assert.dom('[data-test-station-title-loading]').exists();

    deferredRequest.resolve({
      content: {
        data: SECONDARY_STATION,
      },
    });

    this.deferredSecondaryStationRequest = undefined;
    store.deferredSecondaryStationRequest = undefined;

    await settled();

    assert.dom('[data-test-station-title]').hasText('Holfuy 2222');
    assert.dom('[data-test-station-panel-loading]').doesNotExist();
  });

  test('it updates only the map query params when the map view changes with the panel open', async function (this: MapStationPanelTestContext, assert) {
    const fakeRuntime = this.fakeRuntime;

    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');

    fakeRuntime.maps[0]?.setView([8.111111, 46.222222], 9.678);
    fakeRuntime.maps[0]?.emit('moveend');

    await settled();

    assertCurrentRoute(assert, '/map/holfuy-1804', {
      mapLat: '46.22222',
      mapLng: '8.11111',
      mapZoom: '9.68',
    });
    assert.dom('[data-test-station-panel]').exists();
  });
});
