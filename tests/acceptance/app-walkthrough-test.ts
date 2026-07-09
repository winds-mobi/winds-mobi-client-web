import Service from '@ember/service';
import { module, test } from 'qunit';
import {
  click,
  currentURL,
  fillIn,
  find,
  settled,
  visit,
  waitFor,
  waitUntil,
} from '@ember/test-helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import { Type } from '@warp-drive/core/types/symbols';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type {
  History,
  Profile,
  Station,
} from 'winds-mobi-client-web/services/store';

// A single continuous walk through the app's main routes and interactions,
// on top of (not instead of) the focused per-route/per-feature acceptance
// tests. This exercises how the pieces compose together (search -> panel ->
// nearby -> favourites -> settings -> help) rather than re-asserting details
// already covered elsewhere.

type FakeStoreRequest = {
  url?: string;
  method?: string;
};

const MAP_STATION: Station = {
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

const NEARBY_STATION: Station = {
  id: 'holfuy-2222',
  altitude: 2222,
  latitude: 46.7,
  longitude: 7.9,
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
};

const SEARCH_STATION: Station = {
  id: 'holfuy-1850',
  altitude: 560,
  latitude: 46.68084,
  longitude: 7.82554,
  isPeak: false,
  providerName: 'holfuy.com',
  providerUrl: 'https://example.com/stations/holfuy-1850',
  name: 'Lehn',
  last: {
    timestamp: 1_710_000_000_000,
    direction: 30,
    speed: 19,
    gusts: 22,
    temperature: 12,
    humidity: 60,
    pressure: 1010,
    rain: 0,
  },
  [Type]: 'station',
};

const ALL_STATIONS = [MAP_STATION, NEARBY_STATION, SEARCH_STATION];

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
        picture: 'https://example.com/avatar.png',
        favorites: [...this.favorites],
        [Type]: 'profile',
      };

      return Promise.resolve({ content: { data: profile } });
    }

    if (url.includes('/historic/')) {
      return Promise.resolve({ content: { data: HISTORY_FIXTURES } });
    }

    const singleStation = ALL_STATIONS.find((station) =>
      url.includes(`/stations/${station.id}?`)
    );

    if (singleStation) {
      return Promise.resolve({ content: { data: singleStation } });
    }

    const params = new URL(url, 'https://winds.mobi').searchParams;

    if (params.has('search')) {
      const term = params.get('search') ?? '';
      const matches = ALL_STATIONS.filter((station) =>
        station.name.toLowerCase().includes(term.toLowerCase())
      );

      return Promise.resolve({ content: { data: matches } });
    }

    if (params.has('ids')) {
      const ids = params.getAll('ids');
      const matches = ALL_STATIONS.filter((station) =>
        ids.includes(station.id)
      );

      return Promise.resolve({ content: { data: matches } });
    }

    return Promise.resolve({ content: { data: ALL_STATIONS } });
  }
}

// Stubbed before navigating to /nearby: the permission sync runs once, when
// the route's location-permission modifier first mounts, so it must already
// be in place before that transition — registering it after arriving on the
// route (e.g. after a nav-link click) is too late to be picked up.
function stubGrantedPermission(nearbyLocation: NearbyLocationService) {
  nearbyLocation.syncPermissionState = async () => {
    nearbyLocation.permissionState = 'granted';
    nearbyLocation.requestState = 'ready';
    nearbyLocation.coordinates = {
      accuracy: 20,
      latitude: 46.7,
      longitude: 7.9,
    };
  };
}

function favoriteMutations(calls: { method: string; url: string }[]) {
  return calls.filter(({ url }) => url.includes('/user/profile/favorites/'));
}

module('Acceptance | app walkthrough', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);

    const nearbyLocation = this.owner.lookup('service:nearby-location');
    stubGrantedPermission(nearbyLocation);
  });

  test('an anonymous visitor searches, opens a station, browses nearby, and checks settings and help', async function (assert) {
    // Land on the map with no station selected.
    await visit('/map?latitude=46.54321&longitude=8.12345&zoom=9.5');

    assert.dom('[data-test-station-panel]').doesNotExist();
    assert.dom('[data-test-navbar-search="navbar"]').exists();

    // Search for a station and open it.
    await fillIn('[data-test-navbar-search="navbar"] input', 'leh');
    await waitUntil(() =>
      find('[data-test-navbar-search-result="holfuy-1850"]')
    );

    await click('[data-test-navbar-search-result="holfuy-1850"]');

    assert.dom('[data-test-station-title]').hasText('Lehn');
    assert.dom('[data-test-station-wind-section]').exists();
    assert.dom('[data-test-station-air-section]').exists();

    // Close the panel; the map view is preserved.
    await click('[data-test-station-close]');

    assert.dom('[data-test-station-panel]').doesNotExist();

    // Head to the nearby view (location access already stubbed as granted).
    await click('[data-test-navbar-link="nearby"]');
    assert.strictEqual(currentURL(), '/nearby');

    assert.dom('[data-test-nearby-location-prompt]').doesNotExist();

    // Open a nearby station from its card, landing back on the map.
    await click('[data-test-nearby-station-card] [data-test-station-title]');

    assert.dom('[data-test-station-panel]').exists();

    // Check the settings page (toggle persistence itself is covered by
    // settings-route-test.ts; touching it here would leak into that file's
    // shared module-scope storage cell within the same test run).
    await click('[data-test-navbar-link="settings"]');
    assert.strictEqual(currentURL(), '/settings');
    assert.dom('[data-test-setting="showGustsOutline"]').exists();

    // Check the help page.
    await click('[data-test-navbar-link="help"]');
    assert.strictEqual(currentURL(), '/help');
    assert.dom('[data-test-help-changelog]').exists();

    // Never signed in, so no favorite/profile requests were made.
    const store = this.owner.lookup('service:store') as FakeStoreService;
    assert.strictEqual(favoriteMutations(store.calls).length, 0);
  });

  test('a signed-in visitor favourites a station and finds it again in favourites', async function (assert) {
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;
    await authenticateSession();

    await visit('/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13');
    await waitFor('[data-test-station-favorite]');

    const store = this.owner.lookup('service:store') as FakeStoreService;

    assert
      .dom('[data-test-station-favorite]')
      .hasAria('pressed', 'false', 'not yet a favourite');

    // Star the open station. The panel's own profile request is cached for
    // the life of this mount (see the header component's `@cached
    // profileRequest`), so — same as station-favorite-test.ts — we assert
    // the mutation fired rather than an in-place visual flip; the fake store
    // has no shared cache to reactively update an already-mounted request.
    // `store.favorites` below stands in for "the backend now reflects this,"
    // which the *next* fresh mount (the favourites route, then reopening the
    // station) will correctly read.
    store.favorites = ['holfuy-1804'];
    await click('[data-test-station-favorite]');

    let mutations = favoriteMutations(store.calls);
    assert.strictEqual(mutations.length, 1);
    assert.strictEqual(mutations[0]?.method, 'POST');

    // Jump to the favourites view from the account menu.
    await click('[data-test-navbar-auth]');
    await click('[data-test-navbar-auth-item="favorites"]');
    assert.strictEqual(currentURL(), '/favorites');

    assert
      .dom('[data-test-nearby-station-card] [data-test-station-title]')
      .hasText('Holfuy 1804');

    // Reopen it from the favourites card: a fresh mount, so the star
    // correctly reflects the now-favourited state.
    await click('[data-test-nearby-station-card] [data-test-station-title]');
    await waitFor('[data-test-station-favorite]');

    assert
      .dom('[data-test-station-favorite]')
      .hasAria('pressed', 'true', 'the fresh mount picks up the favourite');

    // Unstar it.
    store.favorites = [];
    await click('[data-test-station-favorite]');

    mutations = favoriteMutations(store.calls);
    assert.strictEqual(mutations.length, 2, 'one add and one remove');
    assert.strictEqual(mutations[1]?.method, 'DELETE');

    // Back in favourites, a fresh mount shows the now-empty list.
    await click('[data-test-navbar-auth]');
    await click('[data-test-navbar-auth-item="favorites"]');
    await waitFor('[data-test-favorites-empty]');

    assert.dom('[data-test-nearby-station-card]').doesNotExist();
  });
});
