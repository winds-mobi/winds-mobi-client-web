import { module, test } from 'qunit';
import { click, findAll, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import {
  setupStubbedApi,
  stationsApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import type { Station } from 'winds-mobi-client-web/services/store';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

const STATION_FIXTURES: Station[] = [
  stationFixture({ latitude: 46.521, longitude: 6.632 }),
  stationFixture({
    id: 'holfuy-2222',
    altitude: 2222,
    latitude: 46.53,
    longitude: 6.64,
    isPeak: true,
    name: 'Holfuy 2222',
    last: {
      direction: 220,
      speed: 20,
      gusts: 28,
      temperature: 3,
      humidity: 58,
      pressure: 1008,
    },
  }),
];

function countStationRequests(calls: string[]) {
  return calls.filter((url) => url.includes('/stations/')).length;
}

const FAVORITES_CARD_SELECTOR = '[data-test-nearby-station-card]';

module('Acceptance | favorites route', function (hooks) {
  setupApplicationTest(hooks);
  const api = setupStubbedApi(hooks);

  hooks.beforeEach(function () {
    api.respond = stationsApi({ stations: STATION_FIXTURES });
  });

  test('with no favourites it shows the empty state and skips the station request', async function (assert) {
    await visit('/favorites');

    assert.dom('[data-test-id-list-empty="favorites"]').exists();
    assert.dom(FAVORITES_CARD_SELECTOR).doesNotExist();
    assert.strictEqual(countStationRequests(api.calls), 0);
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
