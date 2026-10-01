import Service from '@ember/service';
import { module, test } from 'qunit';
import { findAll, render } from '@ember/test-helpers';
import { Type } from '@warp-drive/core/types/symbols';
import {
  setupRenderingTest,
  type RenderedTestContext,
} from 'winds-mobi-client-web/tests/helpers';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { Station } from 'winds-mobi-client-web/services/store';
import StationCompactCard from 'winds-mobi-client-web/components/station/compact-card';
import { trackedObject } from '@ember/reactive/collections';

interface StationCompactCardTestContext extends RenderedTestContext {
  station: Station;
}

class FakeStoreService extends Service {
  request() {
    return Promise.resolve({ content: { data: [] } });
  }
}

const STATION: Station = {
  id: 'holfuy-1804',
  altitude: 1804,
  latitude: 46.67719,
  longitude: 7.86323,
  isPeak: false,
  providerName: 'Holfuy',
  providerUrl: 'https://example.com/stations/holfuy-1804',
  name: 'Holfuy 1804',
  last: {
    timestamp: Date.now() - 5 * 60 * 1000,
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

module('Integration | Component | station/compact-card', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('it renders the name, altitude, and wind speed/gusts', async function (this: StationCompactCardTestContext, assert) {
    const station: StationCompactCardTestContext['station'] = STATION;

    await render(
      <template><StationCompactCard @station={{station}} /></template>
    );

    assert
      .dom(`[data-test-nearby-station-card-compact="${STATION.id}"]`)
      .exists();
    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
    assert.dom(this.element).includesText('1,804');
    assert.dom(this.element).includesText('12');
    assert.dom(this.element).includesText('18');
  });

  test('it shows the peak icon only for peak stations', async function (this: StationCompactCardTestContext, assert) {
    const state = trackedObject({ station: { ...STATION, isPeak: false } });

    await render(
      <template><StationCompactCard @station={{state.station}} /></template>
    );
    assert.dom('svg', findAll('dl')[0]).doesNotExist();

    state.station = { ...STATION, isPeak: true };
    await render(
      <template><StationCompactCard @station={{state.station}} /></template>
    );
    assert.dom('svg', findAll('dl')[0]).exists();
  });

  test('it colours the wind speed by its band', async function (this: StationCompactCardTestContext, assert) {
    const station: StationCompactCardTestContext['station'] = STATION;

    await render(
      <template><StationCompactCard @station={{station}} /></template>
    );

    const speedDd = findAll('dd').find(
      (element) => element.textContent?.trim() === '12'
    );

    assert.true(
      speedDd?.classList.contains(windToTextClass(STATION.last.speed))
    );
  });
});
