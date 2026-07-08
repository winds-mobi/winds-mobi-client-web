import Service from '@ember/service';
import { module, test } from 'qunit';
import { findAll, visit, waitFor, waitUntil } from '@ember/test-helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import type { Profile, Station } from 'winds-mobi-client-web/services/store';

type FakeStoreRequest = {
  url?: string;
};

const STATION_FIXTURES: Station[] = [
  {
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
  },
  {
    id: 'holfuy-2222',
    altitude: 2222,
    latitude: 46.53,
    longitude: 6.64,
    isPeak: true,
    providerName: 'Holfuy',
    providerUrl: 'https://example.com/stations/holfuy-2222',
    name: 'Holfuy 2222',
    last: {
      timestamp: 1_710_000_000_000,
      direction: 220,
      speed: 20,
      gusts: 28,
      temperature: 3,
      humidity: 58,
      pressure: 1008,
      rain: 0,
    },
    [Type]: 'station',
  },
];

// Reversed relative to STATION_FIXTURES to pin the profile-order sorting.
const PROFILE_FIXTURE: Profile = {
  id: 'google-123',
  displayName: 'Michal',
  picture: 'https://example.com/avatar.png',
  favorites: ['holfuy-2222', 'holfuy-1804'],
  [Type]: 'profile',
};

class FakeStoreService extends Service {
  calls: string[] = [];
  profile: Profile = PROFILE_FIXTURE;

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    this.calls.push(url);

    if (url.includes('/user/profile/')) {
      return Promise.resolve({
        content: {
          data: this.profile,
        },
      });
    }

    return Promise.resolve({
      content: {
        data: STATION_FIXTURES,
      },
    });
  }
}

function countProfileRequests(calls: string[]) {
  return calls.filter((url) => url.includes('/user/profile/')).length;
}

function countStationRequests(calls: string[]) {
  return calls.filter((url) => url.includes('/stations/')).length;
}

const FAVORITES_CARD_SELECTOR = '[data-test-nearby-station-card]';

module('Acceptance | favorites route', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('signed out it shows the sign-in prompt and requests nothing', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await visit('/favorites');

    assert.dom('[data-test-favorites-signed-out]').exists();
    assert.dom('[data-test-auth-sign-in="google"]').exists();
    assert.dom('[data-test-auth-sign-in="facebook"]').exists();
    assert.dom(FAVORITES_CARD_SELECTOR).doesNotExist();
    assert.strictEqual(store.calls.length, 0);
  });

  test('the navbar links to the favourites view', async function (assert) {
    await visit('/favorites');

    assert.dom('[data-test-navbar-link="favorites"]').exists();
  });

  test('signed in it renders the favourite stations in profile order', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await authenticateSession();
    await visit('/favorites');

    await waitUntil(() => findAll(FAVORITES_CARD_SELECTOR).length === 2);

    assert.dom('[data-test-favorites-signed-out]').doesNotExist();
    // The navbar account menu fetches the profile too — assert presence,
    // not an exact count.
    assert.true(countProfileRequests(store.calls) >= 1);
    assert.true(countStationRequests(store.calls) > 0);

    const titles = findAll(
      `${FAVORITES_CARD_SELECTOR} [data-test-station-title]`
    ).map((element) => element.textContent?.trim());

    assert.deepEqual(
      titles,
      ['Holfuy 2222', 'Holfuy 1804'],
      'cards follow the profile favorites order, not the response order'
    );
  });

  test('signed in with no favourites it shows the empty state and skips the station request', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    store.profile = {
      ...PROFILE_FIXTURE,
      favorites: [],
    };

    await authenticateSession();
    await visit('/favorites');

    await waitFor('[data-test-favorites-empty]');

    assert.dom('[data-test-favorites-empty]').exists();
    assert.dom(FAVORITES_CARD_SELECTOR).doesNotExist();
    assert.strictEqual(countStationRequests(store.calls), 0);
  });
});
