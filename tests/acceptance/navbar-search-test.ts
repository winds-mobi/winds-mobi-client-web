import { module, test } from 'qunit';
import { click, currentURL, fillIn, visit } from '@ember/test-helpers';
import type { Station } from 'winds-mobi-client-web/services/store';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import {
  setupStubbedApi,
  stationsApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

const SEARCH_STATION: Station = stationFixture({
  id: 'holfuy-1850',
  altitude: 560,
  latitude: 46.68084,
  longitude: 7.82554,
  providerName: 'holfuy.com',
  name: 'Lehn',
  last: {
    timestamp: 1_775_333_618_000,
    direction: 30,
    speed: 19,
    gusts: 22,
    temperature: 12,
    humidity: 60,
    pressure: 1010,
  },
});

const HELP_STATION: Station = stationFixture({
  providerName: 'holfuy.com',
  last: { timestamp: 1_775_333_618_000 },
});

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
  const api = setupStubbedApi(hooks);

  hooks.beforeEach(function () {
    api.respond = stationsApi({ stations: [SEARCH_STATION, HELP_STATION] });
  });

  test('it searches from the desktop navbar and recenters on the selected station at zoom 10', async function (assert) {
    await visit('/all?latitude=46.54321&longitude=8.12345&zoom=9.5');
    await fillIn('[data-test-navbar-search="navbar"] input', 'leh');

    const searchParams = lastSearchRequestParams(api.calls);
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
      station: 'holfuy-1850',
      latitude: '46.68084',
      longitude: '7.82554',
      zoom: '10',
    });
  });

  test('it biases toward the default view on a route with no map at all', async function (assert) {
    await visit('/help');
    await fillIn('[data-test-navbar-search="navbar"] input', 'leh');

    const searchParams = lastSearchRequestParams(api.calls);
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
      station: 'holfuy-1850',
      latitude: '46.68084',
      longitude: '7.82554',
      zoom: '10',
    });
  });

  test('it shows empty state for unmatched queries and does not search for a single character', async function (assert) {
    await visit('/all');
    await fillIn('[data-test-navbar-search="navbar"] input', 'l');

    assert.strictEqual(countSearchRequests(api.calls), 0);

    await fillIn('[data-test-navbar-search="navbar"] input', 'zz');

    assert
      .dom('[data-test-navbar-search-empty]')
      .includesText('No stations found.');
  });

  test('it clears the search field and closes the results after selecting a station', async function (assert) {
    await visit('/all?latitude=46.54321&longitude=8.12345&zoom=9.5');
    await fillIn('[data-test-navbar-search="navbar"] input', 'leh');

    await click('[data-test-navbar-search-result="holfuy-1850"]');

    assert.dom('[data-test-navbar-search="navbar"] input').hasValue('');
    assert.dom('[data-test-navbar-search-result="holfuy-1850"]').doesNotExist();
  });
});
