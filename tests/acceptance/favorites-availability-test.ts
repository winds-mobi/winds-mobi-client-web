import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, visit } from '@ember/test-helpers';
import { Type } from '@warp-drive/core/types/symbols';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import type { Station } from 'winds-mobi-client-web/services/store';

// Favourites are always available: the nav link and the heart show for every
// visitor, with no setting or beta toggle. Their behaviour is covered by
// favorites-route-test.ts and station-favorite-test.ts.

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

class FakeStoreService extends Service {
  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    if (url.includes('/historic/')) {
      return Promise.resolve({ content: { data: [] } });
    }

    if (url.includes(`/stations/${STATION_FIXTURE.id}/?`)) {
      return Promise.resolve({ content: { data: STATION_FIXTURE } });
    }

    return Promise.resolve({ content: { data: [STATION_FIXTURE] } });
  }
}

module('Acceptance | favourites availability', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('the favourites nav link and heart always show', async function (assert) {
    await visit('/map/holfuy-1804');

    assert.dom('[data-test-navbar-link="favorites"]').exists();
    assert.dom('[data-test-station-favorite]').exists();

    await click('[data-test-navbar-mobile-menu-button]');
    assert
      .dom('[data-test-navbar-mobile-menu] [data-test-navbar-link="favorites"]')
      .exists();
  });

  test('settings has no Favourites toggle', async function (assert) {
    await visit('/settings');

    assert.dom('[data-test-setting="favoritesFeatureEnabled"]').doesNotExist();
  });
});
