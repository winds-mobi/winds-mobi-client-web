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
import {
  setupStubbedApi,
  stationsApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import { hasWebGL } from 'winds-mobi-client-web/tests/helpers/webgl';
import type { Station } from 'winds-mobi-client-web/services/store';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

// Every test in this module waits on MapLibre's `idle` event (directly or
// via the bounds-driven station request it feeds) — see tests/helpers/webgl.ts.
const webGLAvailable = hasWebGL();

const STATION_FIXTURES: Station[] = [stationFixture()];

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
  const api = setupStubbedApi(hooks);

  hooks.beforeEach(function () {
    api.respond = stationsApi({ stations: STATION_FIXTURES });
  });

  test.if(
    'it uses the URL view for the initial map and station request',
    webGLAvailable,
    async function (this: TestContext, assert) {
      await visit('/all?longitude=8.12345&latitude=46.54321&zoom=9.5');

      assertCurrentMapUrl(assert, {
        latitude: '46.54321',
        longitude: '8.12345',
        zoom: '9.5',
      });
      assert.true(
        api.calls.some(
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
      const router = this.owner.lookup('service:router');

      await visit('/all?longitude=8.12345&latitude=46.54321&zoom=9.5');

      // Hold the new bounds' request open, so the test can look at the map
      // while it's still in flight.
      const serve = api.respond;
      let release!: () => void;
      const released = new Promise<void>((resolve) => {
        release = resolve;
      });

      api.respond = async (url) => {
        await released;

        return serve(url);
      };
      void router.transitionTo({
        queryParams: { longitude: 9, latitude: 47, zoom: 9.5 },
      });

      // The held request is a test waiter, so `settled()` would wait for it;
      // wait for the transition to land instead.
      await waitUntil(
        () =>
          new URL(currentURL(), 'https://winds.mobi').searchParams.get(
            'longitude'
          ) === '9'
      );

      // The new bounds' own request is still pending (deliberately, see
      // above) -- the map must keep showing the previous
      // area's markers instead of blinking them away in the meantime (this
      // is what `<Request>`'s `:loading` block, and `all.gts`'s own
      // `lastStations` latch, exist to prevent -- see CLAUDE.md's
      // "Refresh-in-place" section).
      assert
        .dom('[data-station-id="holfuy-1804"]')
        .exists(
          'the previous marker is still on screen while the new bounds are loading'
        );

      release();
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
