import { module, test } from 'qunit';
import { click, findAll, visit } from '@ember/test-helpers';
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

module('Acceptance | station hide toggle', function (hooks) {
  setupApplicationTest(hooks);
  const api = setupStubbedApi(hooks);

  hooks.beforeEach(function () {
    api.respond = stationsApi({
      stations: [STATION_FIXTURE],
      history: HISTORY_FIXTURES,
    });
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
