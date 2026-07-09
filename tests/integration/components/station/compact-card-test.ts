import Service from '@ember/service';
import { module, test } from 'qunit';
import { findAll, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { Station } from 'winds-mobi-client-web/services/store';

type StationCompactCardTestContext = {
  station: Station;
};

class FakeMapRefreshService extends Service {
  lastRefresh = 0;
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
    this.owner.register('service:map-refresh', FakeMapRefreshService);
  });

  test('it renders the name, altitude, and wind speed/gusts', async function (this: StationCompactCardTestContext, assert) {
    this.station = STATION;

    await render(hbs`<Station::CompactCard @station={{this.station}} />`);

    assert
      .dom(`[data-test-nearby-station-card-compact="${STATION.id}"]`)
      .exists();
    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
    assert.dom(this.element).includesText('1,804');
    assert.dom(this.element).includesText('12');
    assert.dom(this.element).includesText('18');
  });

  test('it shows the peak icon only for peak stations', async function (this: StationCompactCardTestContext, assert) {
    this.station = { ...STATION, isPeak: false };

    await render(hbs`<Station::CompactCard @station={{this.station}} />`);
    assert.dom('svg', findAll('dl')[0]).doesNotExist();

    this.station = { ...STATION, isPeak: true };
    await render(hbs`<Station::CompactCard @station={{this.station}} />`);
    assert.dom('svg', findAll('dl')[0]).exists();
  });

  test('it colours the wind speed by its band', async function (this: StationCompactCardTestContext, assert) {
    this.station = STATION;

    await render(hbs`<Station::CompactCard @station={{this.station}} />`);

    const speedDd = findAll('dd').find(
      (element) => element.textContent?.trim() === '12'
    );

    assert.true(
      speedDd?.classList.contains(windToTextClass(STATION.last.speed))
    );
  });
});
