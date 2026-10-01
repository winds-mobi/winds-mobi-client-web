import { module, test } from 'qunit';
import { click, visit } from '@ember/test-helpers';
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

  hooks.beforeEach(function () {
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

  // The requests `action` causes, sorted, since their order isn't the point.
  async function fetchesDuring(
    action: () => Promise<unknown>
  ): Promise<string[]> {
    const start = api.calls.length;

    await action();

    return api.calls.slice(start).map(describe).sort();
  }

  test.if(
    'moving the map with no station open fetches only the new area',
    webGLAvailable,
    async function (assert) {
      await visit(`/all?${HOME_VIEW}`);

      const fetched = await fetchesDuring(() => visit(`/all?${OTHER_VIEW}`));

      assert.deepEqual(fetched, ['map stations']);
    }
  );

  test.if(
    'opening a station fetches it and its history, and refreshes the map stations with it',
    webGLAvailable,
    async function (assert) {
      await visit(`/all?${HOME_VIEW}`);

      const fetched = await fetchesDuring(() =>
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
      await visit(`/all?${HOME_VIEW}`);
      await fetchesDuring(() =>
        visit(`/all?${HOME_VIEW}&station=${STATION_A._id}`)
      );

      const fetched = await fetchesDuring(() =>
        visit(`/all?${HOME_VIEW}&station=${STATION_B._id}`)
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
      await visit(`/all?${HOME_VIEW}`);
      await fetchesDuring(() =>
        visit(`/all?${HOME_VIEW}&station=${STATION_A._id}`)
      );

      const fetched = await fetchesDuring(() =>
        visit(`/all?${OTHER_VIEW}&station=${STATION_A._id}`)
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
      await visit(`/all?${HOME_VIEW}`);
      await fetchesDuring(() =>
        visit(`/all?${HOME_VIEW}&station=${STATION_A._id}`)
      );

      const start = api.calls.length;

      await visit(`/all?${HOME_VIEW}`);

      assert.deepEqual(api.calls.slice(start).map(describe), []);
    }
  );
});
