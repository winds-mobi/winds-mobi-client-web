import { module, test } from 'qunit';
import { click, type TestContext, visit, waitUntil } from '@ember/test-helpers';
import RefreshService from 'winds-mobi-client-web/services/refresh';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { setupStubbedApi } from 'winds-mobi-client-web/tests/helpers/stub-api';
import { hasWebGL } from 'winds-mobi-client-web/tests/helpers/webgl';

// The map needs real WebGL — see tests/helpers/webgl.ts.
const webGLAvailable = hasWebGL();

const STATION_ID = 'holfuy-1804';

// The raw (pre-handler) API shape of the one station every request returns.
const STATION_PAYLOAD = {
  _id: STATION_ID,
  name: 'Holfuy 1804',
  short: 'Holfuy',
  alt: 1804,
  peak: false,
  status: 'green',
  'pv-name': 'Holfuy',
  loc: { type: 'Point', coordinates: [7.86323, 46.67719] },
  last: { _id: 1_710_000_000, 'w-dir': 240, 'w-avg': 12, 'w-max': 18 },
};

class ShortIntervalRefreshService extends RefreshService {
  refreshIntervalMs = 75;
  countdownTickMs = 10;
}

const SHORT_CYCLE_GRACE_MS = 20;

class ShortGraceRefreshService extends RefreshService {
  cycleGraceMs = SHORT_CYCLE_GRACE_MS;
}

// Refreshing needs the real store's cache policy and invalidation, so this
// module stubs the network (see tests/helpers/stub-api.ts) instead of
// registering a fake `service:store` like the other acceptance modules.
module('Acceptance | refresh', function (hooks) {
  setupApplicationTest(hooks);

  const api = setupStubbedApi(hooks);

  hooks.beforeEach(function () {
    api.respond = (url) => {
      if (url.pathname.includes('/historic/')) {
        return [];
      }

      return url.pathname.endsWith(`/${STATION_ID}/`)
        ? STATION_PAYLOAD
        : [STATION_PAYLOAD];
    };
  });

  function count() {
    return {
      list: api.calls.filter((url) => url.includes('/stations/?')).length,
      station: api.calls.filter((url) =>
        url.includes(`/stations/${STATION_ID}/?`)
      ).length,
      history: api.calls.filter((url) =>
        url.includes(`/stations/${STATION_ID}/historic/`)
      ).length,
    };
  }

  // The map requests its stations once MapLibre has settled on the routed view
  // (its `idle` event), a little after the visit itself resolves.
  function waitForMapStations() {
    return waitUntil(() => count().list > 0, { timeout: 5000 });
  }

  // Wind, air and last-hour each fetch their own history.
  const HISTORY_SECTIONS = 3;

  test.if(
    'the navbar button re-fetches the map and the open station',
    webGLAvailable,
    async function (assert) {
      await visit(
        `/map/${STATION_ID}?latitude=46.67719&longitude=7.86323&zoom=13`
      );

      await waitForMapStations();

      const before = count();

      await click('[data-test-navbar-refresh]');

      assert.deepEqual(count(), {
        list: before.list + 1,
        station: before.station + 1,
        history: before.history + HISTORY_SECTIONS,
      });
    }
  );

  test.if(
    'the countdown re-fetches the map and the open station once it runs out',
    webGLAvailable,
    async function (this: TestContext, assert) {
      this.owner.register('service:refresh', ShortIntervalRefreshService);

      await visit(
        `/map/${STATION_ID}?latitude=46.67719&longitude=7.86323&zoom=13`
      );

      const before = count();

      await waitUntil(() => {
        const now = count();

        return (
          now.list > before.list &&
          now.station > before.station &&
          now.history >= before.history + HISTORY_SECTIONS
        );
      });

      assert.ok(true, 'every request on screen was re-fetched');
    }
  );

  test.if(
    'moving the map re-fetches the open station too and restarts the countdown',
    webGLAvailable,
    async function (this: TestContext, assert) {
      this.owner.register('service:refresh', ShortGraceRefreshService);

      const refresh = this.owner.lookup('service:refresh');

      await visit(
        `/map/${STATION_ID}?latitude=46.67719&longitude=7.86323&zoom=13`
      );
      await waitForMapStations();
      // Let the page load's own refresh cycle close, so the move opens a new one.
      await new Promise((resolve) =>
        setTimeout(resolve, SHORT_CYCLE_GRACE_MS * 2)
      );

      const before = count();
      const cyclesBefore = refresh.refreshCount;

      await visit(`/map/${STATION_ID}?latitude=46.9&longitude=8.3&zoom=13`);
      // The map flies to the new view and fetches its area once MapLibre has
      // settled there.
      await waitUntil(() => count().list > before.list, { timeout: 5000 });

      const after = count();

      assert.strictEqual(after.list, before.list + 1, 'new map area fetched');
      assert.strictEqual(
        after.station,
        before.station + 1,
        'the open station was re-fetched alongside it'
      );
      assert.strictEqual(
        after.history,
        before.history + HISTORY_SECTIONS,
        'and its history'
      );
      assert.strictEqual(
        refresh.refreshCount,
        cyclesBefore + 1,
        'as one refresh, which restarted the countdown'
      );
    }
  );

  test('the navbar button re-fetches the nearby list', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');

    nearbyLocation.syncPermissionState = () => {
      nearbyLocation.permissionState = 'granted';
      nearbyLocation.requestState = 'ready';
      nearbyLocation.coordinates = {
        accuracy: 20,
        latitude: 46.521,
        longitude: 6.632,
      };
      return Promise.resolve();
    };

    await visit('/nearby');

    const before = count();

    await click('[data-test-navbar-refresh]');

    assert.strictEqual(count().list, before.list + 1);
  });
});
