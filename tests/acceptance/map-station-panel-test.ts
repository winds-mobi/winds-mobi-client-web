import Service from '@ember/service';
import { Type } from '@warp-drive/core/types/symbols';
import { module, test } from 'qunit';
import {
  click,
  currentURL,
  settled,
  type TestContext,
  visit,
  waitUntil,
} from '@ember/test-helpers';
import MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import type { History, Station } from 'winds-mobi-client-web/services/store';

type DeferredRequest = {
  promise: Promise<{ content: { data: Station } }>;
  resolve: (value: { content: { data: Station } }) => void;
};

type FakeStoreRequest = {
  url?: string;
};

type MapStationPanelTestContext = TestContext & {
  deferredSecondaryStationRequest?: DeferredRequest;
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
  calls: string[] = [];
  deferredSecondaryStationRequest?: DeferredRequest;
  private requestCache = new Map<
    string,
    Promise<{ content: { data: History[] | Station | Station[] } }>
  >();

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';
    this.calls.push(url);

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

class ShortIntervalMapRefreshService extends MapRefreshService {
  refreshIntervalMs = 75;
  countdownTickMs = 10;
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

function countStationListRequests(calls: string[]) {
  return calls.filter((url) => url.includes('/stations?')).length;
}

function countStationDetailRequests(calls: string[], stationId: string) {
  return calls.filter((url) => url.includes(`/stations/${stationId}?`)).length;
}

function countHistoryRequests(calls: string[], stationId: string) {
  return calls.filter((url) => url.includes(`/stations/${stationId}/historic/`))
    .length;
}

async function selectStationMarker(stationId: string) {
  await waitUntil(() =>
    Boolean(document.querySelector(`[data-station-id="${stationId}"]`))
  );

  await click(`[data-station-id="${stationId}"]`);
}

module('Acceptance | map station panel', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function (this: MapStationPanelTestContext) {
    this.deferredSecondaryStationRequest = undefined;

    this.owner.register('service:store', FakeStoreService);
  });

  test('it deep-links the panel and map state from the URL', async function (assert) {
    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');

    assertCurrentRoute(assert, '/map/holfuy-1804', {
      mapLat: '46.67719',
      mapLng: '7.86323',
      mapZoom: '13',
    });
    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
    assert.dom('[data-test-station-panel]').includesText('1,804 m');
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

  test('it keeps the current map view when selecting another station from the map', async function (assert) {
    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');
    await selectStationMarker('holfuy-2222');

    await waitUntil(() => currentURL().startsWith('/map/holfuy-2222?'));

    assertCurrentRoute(assert, '/map/holfuy-2222', {
      mapLat: '46.67719',
      mapLng: '7.86323',
    });
    assert.dom('[data-test-station-title]').hasText('Holfuy 2222');
  });

  test('it keeps the panel shell mounted while the next station loads', async function (this: MapStationPanelTestContext, assert) {
    const deferredRequest = createDeferredRequest();
    const store = this.owner.lookup('service:store') as FakeStoreService;

    this.deferredSecondaryStationRequest = deferredRequest;
    store.deferredSecondaryStationRequest = deferredRequest;

    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');
    await selectStationMarker('holfuy-2222');

    await waitUntil(() => currentURL().startsWith('/map/holfuy-2222?'));

    assert.dom('[data-test-station-panel]').exists();
    assert.dom('[data-test-station-title]').doesNotExist();

    deferredRequest.resolve({
      content: {
        data: SECONDARY_STATION,
      },
    });

    this.deferredSecondaryStationRequest = undefined;
    store.deferredSecondaryStationRequest = undefined;

    await settled();

    assert.dom('[data-test-station-title]').hasText('Holfuy 2222');
  });

  test('it force refreshes map and station requests from the navbar button', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');

    const initialStationListRequests = countStationListRequests(store.calls);
    const initialStationDetailRequests = countStationDetailRequests(
      store.calls,
      'holfuy-1804'
    );
    const initialHistoryRequests = countHistoryRequests(
      store.calls,
      'holfuy-1804'
    );

    await click('[data-test-navbar-refresh]');

    assert.strictEqual(
      countStationListRequests(store.calls),
      initialStationListRequests + 1
    );
    assert.strictEqual(
      countStationDetailRequests(store.calls, 'holfuy-1804'),
      initialStationDetailRequests + 1
    );
    assert.strictEqual(
      countHistoryRequests(store.calls, 'holfuy-1804'),
      initialHistoryRequests + 1
    );
  });

  test('it auto refreshes map and station requests after the refresh interval', async function (assert) {
    this.owner.register('service:map-refresh', ShortIntervalMapRefreshService);

    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');

    const initialStationListRequests = countStationListRequests(store.calls);
    const initialStationDetailRequests = countStationDetailRequests(
      store.calls,
      'holfuy-1804'
    );
    const initialHistoryRequests = countHistoryRequests(
      store.calls,
      'holfuy-1804'
    );

    await waitUntil(
      () =>
        countStationListRequests(store.calls) > initialStationListRequests &&
        countStationDetailRequests(store.calls, 'holfuy-1804') >
          initialStationDetailRequests &&
        countHistoryRequests(store.calls, 'holfuy-1804') >
          initialHistoryRequests
    );

    assert.true(
      countStationListRequests(store.calls) >= initialStationListRequests + 1
    );
    assert.true(
      countStationDetailRequests(store.calls, 'holfuy-1804') >=
        initialStationDetailRequests + 1
    );
    assert.true(
      countHistoryRequests(store.calls, 'holfuy-1804') >=
        initialHistoryRequests + 1
    );
  });
});
