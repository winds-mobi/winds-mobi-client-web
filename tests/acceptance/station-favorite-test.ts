import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
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

    // Shape matters per endpoint: history and the map's bounds query are
    // lists, a single station is one record. Returning the wrong one doesn't
    // fail here — it throws later, wherever the result gets used as the other.
    if (url.includes('/historic/')) {
      return Promise.resolve({ content: { data: HISTORY_FIXTURES } });
    }

    if (url.includes(`/stations/${STATION_FIXTURE.id}/?`)) {
      return Promise.resolve({ content: { data: STATION_FIXTURE } });
    }

    return Promise.resolve({ content: { data: [STATION_FIXTURE] } });
  }
}

module('Acceptance | station favorite toggle', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('starring a station saves it to the local favourites list', async function (assert) {
    await visit('/all?station=holfuy-1804');

    assert
      .dom('[data-test-station-favorite]')
      .hasAria('label', 'Add to favourites')
      .hasAria('pressed', 'false');

    await click('[data-test-station-favorite]');

    assert
      .dom('[data-test-station-favorite]')
      .hasAria('label', 'Remove from favourites')
      .hasAria('pressed', 'true');

    const favorites = this.owner.lookup('service:favorites');

    assert.deepEqual(favorites.stationIds, ['holfuy-1804']);
  });

  test('unstarring a favourite station removes it from the local list', async function (assert) {
    const favorites = this.owner.lookup('service:favorites');

    favorites.add('holfuy-1804');

    await visit('/all?station=holfuy-1804');

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
