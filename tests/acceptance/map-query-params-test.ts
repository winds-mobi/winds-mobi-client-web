import Service from '@ember/service';
import { module, test } from 'qunit';
import {
  click,
  currentURL,
  type TestContext,
  visit,
  waitUntil,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { hasWebGL } from 'winds-mobi-client-web/tests/helpers/webgl';
import { Type } from '@warp-drive/core/types/symbols';
import RefreshService from 'winds-mobi-client-web/services/refresh';
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

class ShortIntervalRefreshService extends RefreshService {
  refreshIntervalMs = 75;
  countdownTickMs = 10;
}

function countStationRequests(calls: string[]) {
  return calls.filter((url) => url.includes('/stations/?')).length;
}

const REMEMBERED_VIEW = { longitude: 9.87654, latitude: 46.12345, zoom: 11.5 };

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
      const store = this.owner.lookup(
        'service:store'
      ) as unknown as FakeStoreService;

      await visit('/map?longitude=8.12345&latitude=46.54321&zoom=9.5');

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
      const store = this.owner.lookup(
        'service:store'
      ) as unknown as FakeStoreService;

      await visit('/map?longitude=8.12345&latitude=46.54321&zoom=9.5');

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
      this.owner.register('service:refresh', ShortIntervalRefreshService);

      const store = this.owner.lookup(
        'service:store'
      ) as unknown as FakeStoreService;

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

      // The logo link's @query targets app/controllers/map.ts's own declared
      // defaults (DEFAULT_MAP_LNG/LAT/ZOOM) exactly -- Ember's query-param
      // serialization omits a param from the URL entirely when its value
      // equals the controller's default, so the "reset to default" URL is
      // bare `/map` with no query string at all, not one explicitly
      // spelling out the defaults.
      assertCurrentMapUrl(assert, {});
    }
  );

  test.if(
    'it remembers the routed view in this browser',
    webGLAvailable,
    async function (this: TestContext, assert) {
      await visit('/map?longitude=8.12345&latitude=46.54321&zoom=9.5');

      assert.deepEqual(
        this.owner
          .lookup('service:tracked-local-storage')
          .getItem('map.lastView'),
        { longitude: 8.12345, latitude: 46.54321, zoom: 9.5 },
        'a view opened from a link is remembered without moving the map'
      );

      await visit('/map?longitude=7.5&latitude=46.25&zoom=10');

      assert.deepEqual(
        this.owner
          .lookup('service:tracked-local-storage')
          .getItem('map.lastView'),
        { longitude: 7.5, latitude: 46.25, zoom: 10 },
        'a later view replaces it'
      );
    }
  );

  test.if(
    'a cold start without a view in the URL reopens the remembered view',
    webGLAvailable,
    async function (this: TestContext, assert) {
      this.owner
        .lookup('service:tracked-local-storage')
        .setItem('map.lastView', REMEMBERED_VIEW);

      await visit('/');

      assertCurrentMapUrl(assert, {
        latitude: '46.12345',
        longitude: '9.87654',
        zoom: '11.5',
      });
    }
  );

  test.if(
    'a view in the URL wins over the remembered one',
    webGLAvailable,
    async function (this: TestContext, assert) {
      this.owner
        .lookup('service:tracked-local-storage')
        .setItem('map.lastView', REMEMBERED_VIEW);

      await visit('/map?longitude=8.12345&latitude=46.54321&zoom=9.5');

      assertCurrentMapUrl(assert, {
        latitude: '46.54321',
        longitude: '8.12345',
        zoom: '9.5',
      });
    }
  );

  test.if(
    'the logo still resets to the default view once the app is running',
    webGLAvailable,
    async function (this: TestContext, assert) {
      this.owner
        .lookup('service:tracked-local-storage')
        .setItem('map.lastView', REMEMBERED_VIEW);

      await visit('/settings');
      await click('[data-test-navbar-logo]');

      assertCurrentMapUrl(assert, {});
    }
  );
});
