import Service from '@ember/service';
import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { Station } from 'winds-mobi-client-web/services/store';

type StationNearbyCardTestContext = {
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

module('Integration | Component | station/nearby-card', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
    this.owner.register('service:map-refresh', FakeMapRefreshService);
  });

  test('it renders the header and the summary sections', async function (this: StationNearbyCardTestContext, assert) {
    this.station = STATION;

    await render(hbs`<Station::NearbyCard @station={{this.station}} />`);

    assert.dom('[data-test-nearby-station-card]').exists();
    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
    assert.dom('[data-test-station-summary-section]').exists();
  });
});
