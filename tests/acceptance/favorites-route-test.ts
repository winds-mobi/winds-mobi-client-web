import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, findAll, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import type { Station } from 'winds-mobi-client-web/services/store';

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

class FakeStoreService extends Service {
  calls: string[] = [];

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    this.calls.push(url);

    return Promise.resolve({
      content: {
        data: STATION_FIXTURES,
      },
      // WarpDrive's `<Request>` `state.refresh()` replays the request it
      // finds echoed back on a resolved response -- without it, a refresh
      // resolves against an empty/unknown request instead of this same URL.
      request,
    });
  }
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

  test('with no favourites it shows the empty state and skips the station request', async function (assert) {
    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;

    await visit('/favorites');

    assert.dom('[data-test-id-list-empty="favorites"]').exists();
    assert.dom(FAVORITES_CARD_SELECTOR).doesNotExist();
    assert.strictEqual(countStationRequests(store.calls), 0);
  });

  test('the navbar links to the favourites view', async function (assert) {
    await visit('/favorites');

    assert.dom('[data-test-navbar-link="favorites"]').exists();
  });

  test('it renders the favourite stations in the order they were added', async function (assert) {
    const favorites = this.owner.lookup('service:favorites');

    // Added in reverse of STATION_FIXTURES to pin the ordering behaviour.
    favorites.add('holfuy-2222');
    favorites.add('holfuy-1804');

    await visit('/favorites');

    assert.dom('[data-test-id-list-empty="favorites"]').doesNotExist();

    const titles = findAll(
      `${FAVORITES_CARD_SELECTOR} [data-test-station-title]`
    ).map((element) => element.textContent?.trim());

    assert.deepEqual(
      titles,
      ['Holfuy 2222', 'Holfuy 1804'],
      'cards follow the order favourites were added, not the response order'
    );
  });

  test('the navbar view switch switches between full and compact cards', async function (assert) {
    const favorites = this.owner.lookup('service:favorites');

    favorites.add('holfuy-1804');
    favorites.add('holfuy-2222');

    await visit('/favorites');

    assert.dom('[data-test-navbar-view-switch="favorites"]').exists();
    assert.dom('[data-test-station-grid-compact="favorites"]').doesNotExist();
    assert
      .dom('[data-test-nearby-station-card-compact]')
      .doesNotExist('compact cards are not rendered in card view');

    await click('[data-test-navbar-view-option="compact"]');

    assert
      .dom(FAVORITES_CARD_SELECTOR)
      .doesNotExist('full cards are not rendered in compact view');
    assert
      .dom('[data-test-nearby-station-card-compact]')
      .exists({ count: STATION_FIXTURES.length });
  });

  test('each surface remembers its own card size', async function (assert) {
    const favorites = this.owner.lookup('service:favorites');

    favorites.add('holfuy-1804');

    // Each surface's view lives in its own route's `view` query param, so
    // picking compact on hidden can't reach favourites' own.
    await visit('/hidden?view=compact');
    await visit('/favorites');

    assert
      .dom(FAVORITES_CARD_SELECTOR)
      .exists('choosing compact on hidden leaves favourites on full cards');
  });
});
