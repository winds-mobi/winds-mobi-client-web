import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, findAll, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import type { History, Station } from 'winds-mobi-client-web/services/store';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

type FakeStoreRequest = {
  url?: string;
};

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

module('Acceptance | station hide toggle', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;
    this.owner.lookup('service:settings').hiddenStationsFeatureEnabled = true;
  });

  test('with the hidden-stations feature off there is no hide control', async function (assert) {
    this.owner.lookup('service:settings').hiddenStationsFeatureEnabled = false;

    await visit('/all?station=holfuy-1804');

    assert.dom('[data-test-station-title]').exists();
    assert.dom('[data-test-station-hide]').doesNotExist();
  });

  test('hiding a station saves it to the local hidden-stations list', async function (assert) {
    await visit('/all?station=holfuy-1804');

    const panelButtons = findAll(
      '[data-test-station-panel] [data-test-station-hide], [data-test-station-panel] [data-test-station-favorite]'
    );

    assert.true(
      panelButtons[0]?.hasAttribute('data-test-station-hide'),
      'the hide button sits before the favourite button'
    );

    assert
      .dom('[data-test-station-hide]')
      .hasAria('label', 'Hide station')
      .hasAria('pressed', 'false');

    await click('[data-test-station-hide]');

    assert
      .dom('[data-test-station-hide]')
      .hasAria('label', 'Unhide station')
      .hasAria('pressed', 'true');

    const hiddenStations = this.owner.lookup('service:hidden-stations');

    assert.deepEqual(hiddenStations.stationIds, ['holfuy-1804']);
  });

  test('unhiding a station removes it from the local hidden-stations list', async function (assert) {
    const hiddenStations = this.owner.lookup('service:hidden-stations');

    hiddenStations.add('holfuy-1804');

    await visit('/all?station=holfuy-1804');

    assert
      .dom('[data-test-station-hide]')
      .hasAria('label', 'Unhide station')
      .hasAria('pressed', 'true');

    await click('[data-test-station-hide]');

    assert
      .dom('[data-test-station-hide]')
      .hasAria('label', 'Hide station')
      .hasAria('pressed', 'false');

    assert.deepEqual(hiddenStations.stationIds, []);
  });
});
