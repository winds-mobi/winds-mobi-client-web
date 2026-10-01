import { module, test } from 'qunit';
import {
  click,
  find,
  settled,
  type TestContext,
  visit,
  waitUntil,
} from '@ember/test-helpers';
import RefreshService from 'winds-mobi-client-web/services/refresh';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { setupStubbedApi } from 'winds-mobi-client-web/tests/helpers/stub-api';
import { hasWebGL } from 'winds-mobi-client-web/tests/helpers/webgl';

// The map needs real WebGL — see tests/helpers/webgl.ts.
const webGLAvailable = hasWebGL();

// The raw (pre-handler) API shape of two stations close enough to share one
// map view.
const STATION_A = {
  _id: 'holfuy-1804',
  name: 'Holfuy 1804',
  alt: 1804,
  peak: false,
  'pv-name': 'Holfuy',
  loc: { type: 'Point', coordinates: [7.86323, 46.67719] },
  last: { _id: 1_710_000_000, 'w-dir': 240, 'w-avg': 12, 'w-max': 18 },
};

const STATION_B = {
  ...STATION_A,
  _id: 'holfuy-2222',
  name: 'Holfuy 2222',
  loc: { type: 'Point', coordinates: [7.87, 46.68] },
};

const HOME_VIEW = 'latitude=46.67719&longitude=7.86323&zoom=13';
const OTHER_VIEW = 'latitude=46.9&longitude=8.3&zoom=13';

const SHORT_CYCLE_GRACE_MS = 20;

class ShortGraceRefreshService extends RefreshService {
  cycleGraceMs = SHORT_CYCLE_GRACE_MS;
}

// What a request was for, so the expectations read as the screen's data
// rather than as URLs.
function describe(url: string): string {
  const { pathname } = new URL(url);

  if (pathname.includes('/historic/')) {
    return `history ${pathname.split('/').at(-3)}`;
  }

  if (pathname.endsWith('/stations/')) {
    return 'map stations';
  }

  return `station ${pathname.split('/').at(-2)}`;
}

// Wind, air and last-hour each fetch their own history.
function stationAndHistory(id: string): string[] {
  return [`station ${id}`, ...Array.from({ length: 3 }, () => `history ${id}`)];
}

// Which requests each everyday action costs. A refresh cycle re-fetches
// everything on screen together (see app/services/refresh.ts), so an action
// that fetches anything new also refreshes what's already showing — these
// pin exactly how far that reaches, so a change that adds or drops requests
// shows up here.
module('Acceptance | fetches per action', function (hooks) {
  setupApplicationTest(hooks);

  const api = setupStubbedApi(hooks);

  hooks.beforeEach(function (this: TestContext) {
    this.owner.register('service:refresh', ShortGraceRefreshService);

    api.respond = (url) => {
      if (url.pathname.includes('/historic/')) {
        return [];
      }

      if (url.pathname.endsWith(`/${STATION_A._id}/`)) {
        return STATION_A;
      }

      if (url.pathname.endsWith(`/${STATION_B._id}/`)) {
        return STATION_B;
      }

      return [STATION_A, STATION_B];
    };
  });

  // Waits out the refresh cycle the last fetches opened, so the next action
  // starts a cycle of its own instead of joining this one.
  async function afterCycleCloses() {
    await settled();
    await new Promise((resolve) =>
      setTimeout(resolve, SHORT_CYCLE_GRACE_MS * 5)
    );
    await settled();
  }

  // The requests `action` causes, once the expected number have arrived and
  // the refresh cycle has closed — late enough that an unexpected extra fetch
  // would be caught too. Sorted, since their order isn't the point.
  async function fetchesDuring(
    expectedCount: number,
    action: () => Promise<unknown>
  ): Promise<string[]> {
    const start = api.calls.length;

    await action();
    // The map fetches its area once MapLibre settles, after flying there.
    await waitUntil(() => api.calls.length - start >= expectedCount, {
      timeout: 5000,
    });
    await afterCycleCloses();

    return api.calls.slice(start).map(describe).sort();
  }

  async function openMapAt(view: string) {
    await visit(`/map?${view}`);
    await waitUntil(() => api.calls.length > 0, { timeout: 5000 });
    await afterCycleCloses();
  }

  test.if(
    'moving the map with no station open fetches only the new area',
    webGLAvailable,
    async function (assert) {
      await openMapAt(HOME_VIEW);

      const fetched = await fetchesDuring(1, () => visit(`/map?${OTHER_VIEW}`));

      assert.deepEqual(fetched, ['map stations']);
    }
  );

  test.if(
    'opening a station fetches it and its history, and refreshes the map stations with it',
    webGLAvailable,
    async function (assert) {
      await openMapAt(HOME_VIEW);
      await waitUntil(() => find(`[data-station-id="${STATION_A._id}"]`), {
        timeout: 5000,
      });

      const fetched = await fetchesDuring(5, () =>
        click(`[data-station-id="${STATION_A._id}"]`)
      );

      assert.deepEqual(
        fetched,
        ['map stations', ...stationAndHistory(STATION_A._id)].sort()
      );
    }
  );

  test.if(
    'switching to another station fetches it and refreshes the map stations with it',
    webGLAvailable,
    async function (assert) {
      await openMapAt(HOME_VIEW);
      await fetchesDuring(5, () => visit(`/map/${STATION_A._id}?${HOME_VIEW}`));

      const fetched = await fetchesDuring(5, () =>
        visit(`/map/${STATION_B._id}?${HOME_VIEW}`)
      );

      assert.deepEqual(
        fetched,
        ['map stations', ...stationAndHistory(STATION_B._id)].sort()
      );
    }
  );

  test.if(
    'moving the map with a station open refreshes the station and its history too',
    webGLAvailable,
    async function (assert) {
      await openMapAt(HOME_VIEW);
      await fetchesDuring(5, () => visit(`/map/${STATION_A._id}?${HOME_VIEW}`));

      const fetched = await fetchesDuring(5, () =>
        visit(`/map/${STATION_A._id}?${OTHER_VIEW}`)
      );

      assert.deepEqual(
        fetched,
        ['map stations', ...stationAndHistory(STATION_A._id)].sort()
      );
    }
  );

  test.if(
    'closing the station fetches nothing',
    webGLAvailable,
    async function (assert) {
      await openMapAt(HOME_VIEW);
      await fetchesDuring(5, () => visit(`/map/${STATION_A._id}?${HOME_VIEW}`));

      const start = api.calls.length;

      await visit(`/map?${HOME_VIEW}`);
      await afterCycleCloses();

      assert.deepEqual(api.calls.slice(start).map(describe), []);
    }
  );
});
