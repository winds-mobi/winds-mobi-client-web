import { module, test } from 'qunit';
import { click, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import {
  setupStubbedApi,
  stationsApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import { Type } from '@warp-drive/core/types/symbols';
import type { History, Station } from 'winds-mobi-client-web/services/store';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

const STATION_FIXTURE: Station = stationFixture({
  latitude: 46.521,
  longitude: 6.632,
});

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

module('Acceptance | station favorite toggle', function (hooks) {
  setupApplicationTest(hooks);
  const api = setupStubbedApi(hooks);

  hooks.beforeEach(function () {
    api.respond = stationsApi({
      stations: [STATION_FIXTURE],
      history: HISTORY_FIXTURES,
    });
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
