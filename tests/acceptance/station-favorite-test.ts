import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, visit, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import type FavoritesService from 'winds-mobi-client-web/services/favorites';
import type { History, Station } from 'winds-mobi-client-web/services/store';

type FakeStoreRequest = {
  url?: string;
};

const STATION_FIXTURE: Station = {
  id: 'holfuy-1804',
  altitude: 1804,
  latitude: 46.521,
  longitude: 6.632,
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
};

const HISTORY_FIXTURES: History[] = [
  {
    id: 'holfuy-1804:1710000000',
    direction: 240,
    speed: 12,
    gusts: 18,
    temperature: 7,
    humidity: 65,
    rain: 0,
    timestamp: 1_710_000_000_000,
    [Type]: 'history',
  },
];

class FakeStoreService extends Service {
  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    if (url.includes('/historic/')) {
      return Promise.resolve({ content: { data: HISTORY_FIXTURES } });
    }

    return Promise.resolve({ content: { data: STATION_FIXTURE } });
  }
}

module('Acceptance | station favorite toggle', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;
  });

  test('with beta features off there is no favourite control', async function (assert) {
    this.owner.lookup('service:settings').betaFeaturesEnabled = false;

    await visit('/map/holfuy-1804');

    assert.dom('[data-test-station-title]').exists();
    assert.dom('[data-test-station-favorite]').doesNotExist();
  });

  test('starring a station saves it to the local favourites list', async function (assert) {
    await visit('/map/holfuy-1804');
    await waitFor('[data-test-station-favorite]');

    assert
      .dom('[data-test-station-favorite]')
      .hasAria('label', 'Add to favourites')
      .hasAria('pressed', 'false');

    await click('[data-test-station-favorite]');

    assert
      .dom('[data-test-station-favorite]')
      .hasAria('label', 'Remove from favourites')
      .hasAria('pressed', 'true');

    const favorites = this.owner.lookup(
      'service:favorites'
    ) as FavoritesService;

    assert.deepEqual(favorites.stationIds, ['holfuy-1804']);
  });

  test('unstarring a favourite station removes it from the local list', async function (assert) {
    const favorites = this.owner.lookup(
      'service:favorites'
    ) as FavoritesService;

    favorites.add('holfuy-1804');

    await visit('/map/holfuy-1804');
    await waitFor('[data-test-station-favorite]');

    assert
      .dom('[data-test-station-favorite]')
      .hasAria('label', 'Remove from favourites')
      .hasAria('pressed', 'true');

    await click('[data-test-station-favorite]');

    assert
      .dom('[data-test-station-favorite]')
      .hasAria('label', 'Add to favourites')
      .hasAria('pressed', 'false');

    assert.deepEqual(favorites.stationIds, []);
  });
});
