import Service from '@ember/service';
import { module, test } from 'qunit';
import {
  click,
  currentURL,
  settled,
  type TestContext,
  visit,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { hasWebGL } from 'winds-mobi-client-web/tests/helpers/webgl';
import { Type } from '@warp-drive/core/types/symbols';
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

type StoreResponse = {
  content: { data: Station[] };
  request: FakeStoreRequest;
};

type DeferredResponse = {
  promise: Promise<StoreResponse>;
  resolve: (value: StoreResponse) => void;
};

function createDeferredResponse(): DeferredResponse {
  let resolve!: (value: StoreResponse) => void;

  const promise = new Promise<StoreResponse>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

class FakeStoreService extends Service {
  calls: string[] = [];
  // Set to defer the next genuinely new URL (one not already cached) instead
  // of resolving it immediately -- lets a test inspect the map mid-pan/zoom,
  // while the new bounds request is still in flight.
  deferredNextRequest?: DeferredResponse;
  private requestCache = new Map<string, Promise<StoreResponse>>();

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';
    this.calls.push(url);

    let cachedRequest = this.requestCache.get(url);

    if (!cachedRequest) {
      if (this.deferredNextRequest) {
        cachedRequest = this.deferredNextRequest.promise;
        this.deferredNextRequest = undefined;
      } else {
        cachedRequest = Promise.resolve({
          content: {
            data: STATION_FIXTURES,
          },
          // WarpDrive's `<Request>` `state.refresh()` replays the request it
          // finds echoed back on a resolved response -- without it, a refresh
          // resolves against an empty/unknown request instead of this same
          // URL (confirmed by tracing WarpDrive's own `performRefresh`).
          request,
        });
      }

      this.requestCache.set(url, cachedRequest);
    }

    return cachedRequest;
  }
}

function assertCurrentMapUrl(
  assert: Assert,
  expectedQueryParams: Record<string, string>
) {
  const url = new URL(currentURL(), 'https://winds.mobi');

  assert.strictEqual(url.pathname, '/all');
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

      await visit('/all?longitude=8.12345&latitude=46.54321&zoom=9.5');

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
    'panning the map keeps the previous markers on screen while the new bounds load',
    webGLAvailable,
    async function (this: TestContext, assert) {
      const store = this.owner.lookup(
        'service:store'
      ) as unknown as FakeStoreService;
      const router = this.owner.lookup('service:router');

      await visit('/all?longitude=8.12345&latitude=46.54321&zoom=9.5');

      const deferred = createDeferredResponse();

      store.deferredNextRequest = deferred;
      void router.transitionTo({
        queryParams: { longitude: 9, latitude: 47, zoom: 9.5 },
      });

      // The deferred request isn't a test waiter, so `settled()` resolves
      // with it still pending.
      await settled();

      // The new bounds' own request is still pending (deliberately, via
      // `deferredNextRequest`) -- the map must keep showing the previous
      // area's markers instead of blinking them away in the meantime (this
      // is what `<Request>`'s `:loading` block, and `all.gts`'s own
      // `lastStations` latch, exist to prevent -- see CLAUDE.md's
      // "Refresh-in-place" section).
      assert
        .dom('[data-station-id="holfuy-1804"]')
        .exists(
          'the previous marker is still on screen while the new bounds are loading'
        );

      deferred.resolve({
        content: { data: STATION_FIXTURES },
        request: {},
      });
      await settled();

      assert
        .dom('[data-station-id="holfuy-1804"]')
        .exists('the marker is still there once the new bounds resolve');
    }
  );

  test.if(
    'it resets to the default view when the logo is clicked',
    webGLAvailable,
    async function (assert) {
      await visit('/all?longitude=8.12345&latitude=46.54321&zoom=9.5');
      await click('[data-test-navbar-logo]');

      // The logo link's @query targets app/controllers/all.ts's own declared
      // defaults (DEFAULT_MAP_LNG/LAT/ZOOM) exactly -- Ember's query-param
      // serialization omits a param from the URL entirely when its value
      // equals the controller's default, so the "reset to default" URL is
      // bare `/all` with no query string at all, not one explicitly
      // spelling out the defaults.
      assertCurrentMapUrl(assert, {});
    }
  );
});
