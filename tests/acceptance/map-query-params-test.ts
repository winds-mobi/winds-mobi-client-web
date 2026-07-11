import Service from '@ember/service';
import { module, test } from 'qunit';
import {
  click,
  currentURL,
  settled,
  type TestContext,
  visit,
  waitUntil,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { hasWebGL } from 'winds-mobi-client-web/tests/helpers/webgl';
import { Type } from '@warp-drive/core/types/symbols';
import MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type { Station } from 'winds-mobi-client-web/services/store';

// Every test in this module waits on MapLibre's `idle` event (directly or
// via the bounds-driven station request it feeds) — see tests/helpers/webgl.ts.
const webGLAvailable = hasWebGL();

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

module('Acceptance | map query params', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test.if(
    'it uses the URL view for the initial map and station request',
    webGLAvailable,
    async function (this: TestContext, assert) {
      const store = this.owner.lookup('service:store') as FakeStoreService;

      await visit('/map?longitude=8.12345&latitude=46.54321&zoom=9.5');
      await waitUntil(() => countStationRequests(store.calls) > 0);

      assertCurrentMapUrl(assert, {
        latitude: '46.54321',
        longitude: '8.12345',
        zoom: '9.5',
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
    }
  );

  test.if(
    'it force refreshes stations from the navbar button',
    webGLAvailable,
    async function (this: TestContext, assert) {
      const store = this.owner.lookup('service:store') as FakeStoreService;

      await visit('/map?longitude=8.12345&latitude=46.54321&zoom=9.5');
      await waitUntil(() => countStationRequests(store.calls) > 0);
      await settled();

      const initialStationRequestCount = countStationRequests(store.calls);

      assert.dom('[data-test-navbar-refresh]').exists();

      await click('[data-test-navbar-refresh]');

      assert.strictEqual(
        countStationRequests(store.calls),
        initialStationRequestCount + 1
      );
    }
  );

  test.if(
    'it auto refreshes stations after the refresh interval',
    webGLAvailable,
    async function (this: TestContext, assert) {
      this.owner.register(
        'service:map-refresh',
        ShortIntervalMapRefreshService
      );

      const store = this.owner.lookup('service:store') as FakeStoreService;

      await visit('/map?longitude=8.12345&latitude=46.54321&zoom=9.5');

      const initialStationRequestCount = countStationRequests(store.calls);

      await waitUntil(
        () => countStationRequests(store.calls) > initialStationRequestCount
      );

      assert.true(
        countStationRequests(store.calls) >= initialStationRequestCount + 1
      );
    }
  );

  test.if(
    'it resets to the default view when the logo is clicked',
    webGLAvailable,
    async function (assert) {
      await visit('/map?longitude=8.12345&latitude=46.54321&zoom=9.5');
      await click('[data-test-navbar-logo]');
      await waitUntil(() => currentURL().includes('zoom=7'));
      await settled();

      assertCurrentMapUrl(assert, {
        latitude: '46.8011',
        longitude: '8.2275',
        zoom: '7',
      });
    }
  );
});
