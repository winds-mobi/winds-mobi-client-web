import Service from '@ember/service';
import { module, test } from 'qunit';
import {
  click,
  currentURL,
  fillIn,
  settled,
  visit,
  waitUntil,
} from '@ember/test-helpers';
import { Type } from '@warp-drive/core/types/symbols';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type { History, Station } from 'winds-mobi-client-web/services/store';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';

type FakeStoreRequest = {
  url?: string;
};

const SEARCH_STATION: Station = {
  id: 'holfuy-1850',
  altitude: 560,
  latitude: 46.68084,
  longitude: 7.82554,
  isPeak: false,
  providerName: 'holfuy.com',
  providerUrl: 'https://example.com/stations/holfuy-1850',
  name: 'Lehn',
  last: {
    timestamp: 1_775_333_618_000,
    direction: 30,
    speed: 19,
    gusts: 22,
    temperature: 12,
    humidity: 60,
    pressure: 1010,
    rain: 0,
  },
  [Type]: 'station',
};

const HELP_STATION: Station = {
  id: 'holfuy-1804',
  altitude: 1804,
  latitude: 46.67719,
  longitude: 7.86323,
  isPeak: false,
  providerName: 'holfuy.com',
  providerUrl: 'https://example.com/stations/holfuy-1804',
  name: 'Holfuy 1804',
  last: {
    timestamp: 1_775_333_618_000,
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

class FakeStoreService extends Service {
  calls: string[] = [];

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';
    this.calls.push(url);

    if (url.includes('search=leh')) {
      return Promise.resolve({
        content: {
          data: [SEARCH_STATION],
        },
      });
    }

    if (url.includes('search=zz')) {
      return Promise.resolve({
        content: {
          data: [],
        },
      });
    }

    if (url.includes('/stations/holfuy-1804?')) {
      return Promise.resolve({
        content: {
          data: HELP_STATION,
        },
      });
    }

    if (url.includes('/stations/holfuy-1850?')) {
      return Promise.resolve({
        content: {
          data: SEARCH_STATION,
        },
      });
    }

    if (url.includes('/historic/')) {
      return Promise.resolve({
        content: {
          data: [] as History[],
        },
      });
    }

    if (url.includes('/stations?')) {
      return Promise.resolve({
        content: {
          data: [SEARCH_STATION],
        },
      });
    }

    return Promise.resolve({
      content: {
        data: [],
      },
    });
  }
}

function currentSearchParams() {
  return Object.fromEntries(
    new URL(currentURL(), 'https://winds.mobi').searchParams.entries()
  );
}

function countSearchRequests(calls: string[]) {
  return calls.filter(
    (url) => url.includes('/stations?') && url.includes('search=')
  ).length;
}

module('Acceptance | navbar search', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);

    const nearbyLocation = this.owner.lookup(
      'service:nearby-location'
    ) as NearbyLocationService;

    nearbyLocation.coordinates = {
      accuracy: 10,
      latitude: 46.69299,
      longitude: 7.82667,
    };
  });

  test('it searches from the desktop navbar and recenters on the selected station at zoom 10', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map?mapLat=46.54321&mapLng=8.12345&mapZoom=9.5');
    await fillIn('[data-test-navbar-search="desktop"] input', 'leh');
    await waitUntil(() => countSearchRequests(store.calls) > 0);
    await waitUntil(
      () => document.querySelector('[data-test-navbar-search-results]') !== null
    );

    assert
      .dom('[data-test-navbar-search-result="holfuy-1850"]')
      .includesText('Lehn');
    assert
      .dom('[data-test-navbar-search-result="holfuy-1850"]')
      .includesText('19 km/h');

    await click('[data-test-navbar-search-result="holfuy-1850"]');
    await waitUntil(() => currentURL().startsWith('/map/holfuy-1850?'));
    await settled();

    assert.deepEqual(currentSearchParams(), {
      mapLat: '46.68084',
      mapLng: '7.82554',
      mapZoom: '10',
    });
  });

  test('it uses zoom 10 when searching from a non-map route', async function (assert) {
    await visit('/help');
    await fillIn('[data-test-navbar-search="desktop"] input', 'leh');
    await waitUntil(
      () =>
        document.querySelector(
          '[data-test-navbar-search-result="holfuy-1850"]'
        ) !== null
    );

    await click('[data-test-navbar-search-result="holfuy-1850"]');
    await waitUntil(() => currentURL().startsWith('/map/holfuy-1850?'));
    await settled();

    assert.deepEqual(currentSearchParams(), {
      mapLat: '46.68084',
      mapLng: '7.82554',
      mapZoom: '10',
    });
  });

  test('it shows empty state for unmatched queries and does not search for a single character', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/map');
    await fillIn('[data-test-navbar-search="desktop"] input', 'l');
    await settled();

    assert.strictEqual(countSearchRequests(store.calls), 0);

    await fillIn('[data-test-navbar-search="desktop"] input', 'zz');
    await waitUntil(() => countSearchRequests(store.calls) > 0);
    await waitUntil(
      () => document.querySelector('[data-test-navbar-search-empty]') !== null
    );

    assert.dom('[data-test-navbar-search-empty]').hasText('No stations found.');
  });

  test('it works from the mobile drawer and closes the drawer after selection', async function (assert) {
    await visit('/map?mapLat=46.54321&mapLng=8.12345&mapZoom=9.5');
    await click('[data-test-navbar-mobile-menu-button]');

    assert.dom('[data-test-navbar-mobile-menu]').exists();

    await fillIn(
      '[data-test-navbar-mobile-menu] [data-test-navbar-search="mobile"] input',
      'leh'
    );
    await waitUntil(
      () =>
        document.querySelector(
          '[data-test-navbar-search-result="holfuy-1850"]'
        ) !== null
    );

    await click('[data-test-navbar-search-result="holfuy-1850"]');
    await waitUntil(() => currentURL().startsWith('/map/holfuy-1850?'));
    await settled();

    assert.dom('[data-test-navbar-mobile-menu]').doesNotExist();
  });
});
