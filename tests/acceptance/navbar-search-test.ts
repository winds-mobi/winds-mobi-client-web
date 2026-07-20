import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, currentURL, fillIn, visit, waitFor } from '@ember/test-helpers';
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

    const nearbyLocation = this.owner.lookup('service:nearby-location');

    nearbyLocation.coordinates = {
      accuracy: 10,
      latitude: 46.69299,
      longitude: 7.82667,
    };
  });

  test('it searches from the desktop navbar and recenters on the selected station at zoom 10', async function (assert) {
    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;

    await visit('/map?latitude=46.54321&longitude=8.12345&zoom=9.5');
    await fillIn('[data-test-navbar-search="navbar"] input', 'leh');
    await waitFor('[data-test-navbar-search-results]');

    const searchParams = lastSearchRequestParams(store.calls);
    assert.strictEqual(
      searchParams?.get('near-lat'),
      '46.69299',
      'the search is biased toward the known latitude'
    );
    assert.strictEqual(
      searchParams?.get('near-lon'),
      '7.82667',
      'the search is biased toward the known longitude'
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

  test('it searches without a location bias when the position is unknown', async function (assert) {
    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    nearbyLocation.coordinates = undefined;

    await visit('/map?latitude=46.54321&longitude=8.12345&zoom=9.5');
    await fillIn('[data-test-navbar-search="navbar"] input', 'leh');
    await waitFor('[data-test-navbar-search-results]');

    const searchParams = lastSearchRequestParams(store.calls);
    assert.false(
      searchParams?.has('near-lat'),
      'no latitude bias is sent when the position is unknown'
    );
    assert.false(
      searchParams?.has('near-lon'),
      'no longitude bias is sent when the position is unknown'
    );
  });

  test('it uses zoom 10 when searching from a non-map route', async function (assert) {
    await visit('/help');
    await fillIn('[data-test-navbar-search="navbar"] input', 'leh');
    await waitFor('[data-test-navbar-search-result="holfuy-1850"]');

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
    await waitFor('[data-test-navbar-search-empty]');

    assert.dom('[data-test-navbar-search-empty]').hasText('No stations found.');
  });

  test('it clears the search field and closes the results after selecting a station', async function (assert) {
    await visit('/map?latitude=46.54321&longitude=8.12345&zoom=9.5');
    await fillIn('[data-test-navbar-search="navbar"] input', 'leh');
    await waitFor('[data-test-navbar-search-result="holfuy-1850"]');

    await click('[data-test-navbar-search-result="holfuy-1850"]');

    assert.dom('[data-test-navbar-search="navbar"] input').hasValue('');
    assert.dom('[data-test-navbar-search-results]').doesNotExist();
  });
});
