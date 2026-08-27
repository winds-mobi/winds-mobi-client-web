import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, visit, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import type { Station } from 'winds-mobi-client-web/services/store';

type FakeStoreRequest = {
  url?: string;
};

// direction 240 -> direction index 5 (SW, see azimuth-to-cardinal.ts);
// gusts 38 -> WIND_COLOUR_BANDS index 7 ("wind-40", see wind-to-colour.ts).
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
    timestamp: Date.now(),
    direction: 240,
    speed: 10,
    gusts: 38,
    temperature: 7,
    humidity: 65,
    pressure: 1012,
    rain: 0,
  },
  [Type]: 'station',
};

class FakeStoreService extends Service {
  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    if (url.includes('/historic/')) {
      return Promise.resolve({ content: { data: [] } });
    }

    // `ids=` marks an explicit-id query (favoritesQuery/alarmsQuery), which
    // returns an array; a plain findRecord (the station panel route) returns
    // a single record.
    if (url.includes('ids=')) {
      return Promise.resolve({ content: { data: [STATION_FIXTURE] } });
    }

    return Promise.resolve({ content: { data: STATION_FIXTURE } });
  }
}

module('Acceptance | station alarm', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;
    this.owner.lookup('service:settings').alarmsFeatureEnabled = true;
  });

  test('with beta features off there is no alarm control', async function (assert) {
    this.owner.lookup('service:settings').betaFeaturesEnabled = false;

    await visit('/map/holfuy-1804');

    assert.dom('[data-test-station-title]').exists();
    assert.dom('[data-test-station-alarm]').doesNotExist();
  });

  test('setting an alarm arms it, and the bell reflects the saved state', async function (assert) {
    await visit('/map/holfuy-1804');
    await waitFor('[data-test-station-alarm]');

    assert.dom('[data-test-station-alarm]').hasAria('pressed', 'false');

    await click('[data-test-station-alarm]');
    assert.dom('[data-test-alarm-modal]').exists();
    assert.dom('[data-test-alarm-save]').isDisabled();

    // Arm SW (direction index 5) at the wind-40 band (index 7).
    await click('[data-test-alarm-compass-cell="5-7"]');
    assert.dom('[data-test-alarm-save]').isNotDisabled();

    await click('[data-test-alarm-save]');

    assert.dom('[data-test-alarm-modal]').doesNotExist();
    assert.dom('[data-test-station-alarm]').hasAria('pressed', 'true');

    const alarms = this.owner.lookup('service:alarms');

    assert.true(alarms.has('holfuy-1804'));
    assert.strictEqual(alarms.get('holfuy-1804')?.directionBands[5], 7);
  });

  test('the armed threshold being exceeded marks the station triggered', async function (assert) {
    const alarms = this.owner.lookup('service:alarms');

    alarms.save({
      stationId: 'holfuy-1804',
      directionBands: [null, null, null, null, null, 7, null, null],
      metric: 'gusts',
      createdAt: Date.now(),
    });

    await visit('/map/holfuy-1804');

    assert
      .dom('[data-test-station-alarm-triggered]')
      .hasAttribute('data-test-station-alarm-triggered', 'true');
    assert.true(alarms.triggeredStationIds.has('holfuy-1804'));
  });

  test('deleting an alarm clears it', async function (assert) {
    const alarms = this.owner.lookup('service:alarms');

    alarms.save({
      stationId: 'holfuy-1804',
      directionBands: [null, null, null, null, null, 7, null, null],
      metric: 'gusts',
      createdAt: Date.now(),
    });

    await visit('/map/holfuy-1804');
    await waitFor('[data-test-station-alarm]');

    await click('[data-test-station-alarm]');
    await click('[data-test-alarm-delete]');

    assert.dom('[data-test-alarm-modal]').doesNotExist();
    assert.false(alarms.has('holfuy-1804'));
  });
});
