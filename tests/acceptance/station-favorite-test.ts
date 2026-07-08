import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, visit, waitFor } from '@ember/test-helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import type {
  History,
  Profile,
  Station,
} from 'winds-mobi-client-web/services/store';

type FakeStoreRequest = {
  url?: string;
  method?: string;
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
  calls: { method: string; url: string }[] = [];
  favorites: string[] = [];

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';
    const method = request.method ?? 'GET';

    this.calls.push({ method, url });

    if (url.includes('/user/profile/favorites/')) {
      return Promise.resolve({ content: null });
    }

    if (url.includes('/user/profile/')) {
      const profile: Profile = {
        id: 'google-123',
        displayName: 'Michal',
        favorites: [...this.favorites],
        [Type]: 'profile',
      };

      return Promise.resolve({ content: { data: profile } });
    }

    if (url.includes('/historic/')) {
      return Promise.resolve({ content: { data: HISTORY_FIXTURES } });
    }

    if (url.includes(`/stations/${STATION_FIXTURE.id}?`)) {
      return Promise.resolve({ content: { data: STATION_FIXTURE } });
    }

    return Promise.resolve({ content: { data: [STATION_FIXTURE] } });
  }
}

function favoriteMutations(calls: { method: string; url: string }[]) {
  return calls.filter(({ url }) => url.includes('/user/profile/favorites/'));
}

function profileReads(calls: { method: string; url: string }[]) {
  return calls.filter(
    ({ url, method }) =>
      method === 'GET' && /\/user\/profile\/$/.test(url.split('?')[0] ?? url)
  );
}

module('Acceptance | station favorite toggle', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('signed out there is no star on the station panel', async function (assert) {
    await visit('/map/holfuy-1804');

    assert.dom('[data-test-station-title]').exists();
    assert.dom('[data-test-station-favorite]').doesNotExist();
  });

  test('starring a station posts the favorite and refetches the profile', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    await authenticateSession();
    await visit('/map/holfuy-1804');
    await waitFor('[data-test-station-favorite]');

    assert
      .dom('[data-test-station-favorite]')
      .hasAria('label', 'Add to favourites')
      .hasAria('pressed', 'false');

    const profileReadsBefore = profileReads(store.calls).length;

    store.favorites = ['holfuy-1804'];
    await click('[data-test-station-favorite]');

    const mutations = favoriteMutations(store.calls);

    assert.strictEqual(mutations.length, 1);
    assert.strictEqual(mutations[0]?.method, 'POST');
    assert.true(
      mutations[0]?.url.endsWith('/user/profile/favorites/holfuy-1804/')
    );
    assert.true(
      profileReads(store.calls).length > profileReadsBefore,
      'the profile is refetched after the mutation'
    );
  });

  test('unstarring a favourite station issues a delete', async function (assert) {
    const store = this.owner.lookup('service:store') as FakeStoreService;

    store.favorites = ['holfuy-1804'];

    await authenticateSession();
    await visit('/map/holfuy-1804');
    await waitFor('[data-test-station-favorite]');

    assert
      .dom('[data-test-station-favorite]')
      .hasAria('label', 'Remove from favourites')
      .hasAria('pressed', 'true');

    store.favorites = [];
    await click('[data-test-station-favorite]');

    const mutations = favoriteMutations(store.calls);

    assert.strictEqual(mutations.length, 1);
    assert.strictEqual(mutations[0]?.method, 'DELETE');
  });
});
