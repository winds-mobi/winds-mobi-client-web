import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, visit, waitFor } from '@ember/test-helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import { Type } from '@warp-drive/core/types/symbols';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import type { Profile, Station } from 'winds-mobi-client-web/services/store';

// Login, the favourites view, and the favourite star are beta features (see
// app/services/settings.ts): hidden by default, revealed once a visitor
// opts into "Enable beta features" in Settings. This file covers the
// gating itself; the features' own behaviour once visible is covered by
// navbar-auth-test.ts, favorites-route-test.ts, and station-favorite-test.ts
// (which all opt into beta in their own setup).

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

const PROFILE_FIXTURE: Profile = {
  id: 'google-123',
  displayName: 'Michal',
  favorites: [],
  [Type]: 'profile',
};

class FakeStoreService extends Service {
  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    if (url.includes('/user/profile/')) {
      return Promise.resolve({ content: { data: PROFILE_FIXTURE } });
    }

    if (url.includes('/historic/')) {
      return Promise.resolve({ content: { data: [] } });
    }

    if (url.includes(`/stations/${STATION_FIXTURE.id}?`)) {
      return Promise.resolve({ content: { data: STATION_FIXTURE } });
    }

    return Promise.resolve({ content: { data: [STATION_FIXTURE] } });
  }
}

module('Acceptance | beta features gating', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('login and the favourites nav link are hidden by default', async function (assert) {
    await visit('/map/holfuy-1804');

    assert.dom('[data-test-navbar-auth]').doesNotExist();
    assert.dom('[data-test-navbar-link="favorites"]').doesNotExist();

    await click('[data-test-navbar-mobile-menu-button]');
    assert
      .dom('[data-test-navbar-mobile-menu] [data-test-navbar-link="favorites"]')
      .doesNotExist();
  });

  test('the favourite star is hidden by default even when signed in', async function (assert) {
    await authenticateSession();
    await visit('/map/holfuy-1804');

    assert.dom('[data-test-station-title]').exists();
    assert.dom('[data-test-station-favorite]').doesNotExist();
  });

  test('enabling beta features in settings reveals login and the favourites nav link', async function (assert) {
    await visit('/settings');

    assert.dom('[data-test-navbar-auth]').doesNotExist();

    await click('[data-test-setting="betaFeaturesEnabled"]');

    assert.dom('[data-test-navbar-auth]').exists();
    assert.dom('[data-test-navbar-link="favorites"]').exists();
  });

  test('enabling beta features reveals the favourite star for a signed-in visitor', async function (assert) {
    await authenticateSession();
    await visit('/settings');

    await click('[data-test-setting="betaFeaturesEnabled"]');
    await visit('/map/holfuy-1804');
    await waitFor('[data-test-station-favorite]');

    assert.dom('[data-test-station-favorite]').exists();
  });
});
