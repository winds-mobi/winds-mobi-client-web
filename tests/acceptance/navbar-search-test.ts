import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, currentURL, fillIn, visit } from '@ember/test-helpers';
import { Type } from '@warp-drive/core/types/symbols';
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

    if (url.includes('/stations/holfuy-1804/?')) {
      return Promise.resolve({
        content: {
          data: HELP_STATION,
        },
      });
    }

    if (url.includes('/stations/holfuy-1850/?')) {
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

    if (url.includes('/stations/?')) {
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
    (url) => url.includes('/stations/?') && url.includes('search=')
  ).length;
}

function lastSearchRequestParams(calls: string[]) {
  const url = [...calls]
    .reverse()
    .find((call) => call.includes('/stations/?') && call.includes('search='));

  return url ? new URL(url, 'https://winds.mobi').searchParams : undefined;
}

module('Acceptance | navbar search', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('it searches from the desktop navbar and recenters on the selected station at zoom 10', async function (assert) {
    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;

    await visit('/map?latitude=46.54321&longitude=8.12345&zoom=9.5');
    await fillIn('[data-test-navbar-search="navbar"] input', 'leh');

    const searchParams = lastSearchRequestParams(store.calls);
    assert.strictEqual(
      searchParams?.get('near-lat'),
      '46.54321',
      'the search is biased toward the routed map view, not any physical location'
    );
    assert.strictEqual(
      searchParams?.get('near-lon'),
      '8.12345',
      'the search is biased toward the routed map view, not any physical location'
    );

    assert
      .dom('[data-test-navbar-search-result="holfuy-1850"]')
      .includesText('Lehn');
    assert
      .dom('[data-test-navbar-search-result="holfuy-1850"]')
      .includesText('19 km/h');

    await click('[data-test-navbar-search-result="holfuy-1850"]');

    assert.deepEqual(currentSearchParams(), {
      latitude: '46.68084',
      longitude: '7.82554',
      zoom: '10',
    });
  });

  test('it biases toward the default view on a route with no map at all', async function (assert) {
    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;

    await visit('/help');
    await fillIn('[data-test-navbar-search="navbar"] input', 'leh');

    const searchParams = lastSearchRequestParams(store.calls);
    assert.strictEqual(
      searchParams?.get('near-lat'),
      '46.8011',
      'falls back to the mid-Switzerland default, the same one the map itself opens to'
    );
    assert.strictEqual(searchParams?.get('near-lon'), '8.2275');
  });

  test('it uses zoom 10 when searching from a non-map route', async function (assert) {
    await visit('/help');
    await fillIn('[data-test-navbar-search="navbar"] input', 'leh');

    await click('[data-test-navbar-search-result="holfuy-1850"]');

    assert.deepEqual(currentSearchParams(), {
      latitude: '46.68084',
      longitude: '7.82554',
      zoom: '10',
    });
  });

  test('it shows empty state for unmatched queries and does not search for a single character', async function (assert) {
    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;

    await visit('/map');
    await fillIn('[data-test-navbar-search="navbar"] input', 'l');

    assert.strictEqual(countSearchRequests(store.calls), 0);

    await fillIn('[data-test-navbar-search="navbar"] input', 'zz');

    assert
      .dom('[data-test-navbar-search-empty]')
      .includesText('No stations found.');
  });

  test('it clears the search field and closes the results after selecting a station', async function (assert) {
    await visit('/map?latitude=46.54321&longitude=8.12345&zoom=9.5');
    await fillIn('[data-test-navbar-search="navbar"] input', 'leh');

    await click('[data-test-navbar-search-result="holfuy-1850"]');

    assert.dom('[data-test-navbar-search="navbar"] input').hasValue('');
    assert.dom('[data-test-navbar-search-result="holfuy-1850"]').doesNotExist();
  });
});
