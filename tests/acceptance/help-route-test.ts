import Service from '@ember/service';
import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { Type } from '@warp-drive/core/types/symbols';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import type { History, Station } from 'winds-mobi-client-web/services/store';

type FakeStoreRequest = {
  url?: string;
};

const STATION_FIXTURE: Station = {
  id: 'holfuy-1804',
  altitude: 1804,
  latitude: 46.67719,
  longitude: 7.86323,
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
    id: '1710000000',
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
      return Promise.resolve({
        content: {
          data: HISTORY_FIXTURES,
        },
      });
    }

    return Promise.resolve({
      content: {
        data: STATION_FIXTURE,
      },
    });
  }
}

module('Acceptance | help route', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('it shows the help page and live station example', async function (assert) {
    await visit('/help');

    assert.dom('[data-test-navbar-link=\"help\"]').exists();
    assert.dom('[data-test-navbar-link=\"help\"]').hasText('Help');
    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
    assert.dom('[data-test-station-summary-section]').exists();
    assert.dom('[data-test-station-wind-section]').exists();
    assert.dom('[data-test-station-air-section]').exists();
    assert.dom('[data-test-station-provider-link]').hasText('Holfuy');
    assert.dom('[data-test-help-changelog]').exists();
  });
});
