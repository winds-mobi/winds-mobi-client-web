import { module, test } from 'qunit';
import { click, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import {
  setupStubbedApi,
  stationsApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import type { Station } from 'winds-mobi-client-web/services/store';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

// Favourites are always available: the nav link and the heart show for every
// visitor, with no setting or beta toggle. Their behaviour is covered by
// favorites-route-test.ts and station-favorite-test.ts.

const STATION_FIXTURE: Station = stationFixture({
  latitude: 46.521,
  longitude: 6.632,
});

module('Acceptance | favourites availability', function (hooks) {
  setupApplicationTest(hooks);
  const api = setupStubbedApi(hooks);

  hooks.beforeEach(function () {
    api.respond = stationsApi({ stations: [STATION_FIXTURE] });
  });

  test('the favourites nav link and heart always show', async function (assert) {
    await visit('/all?station=holfuy-1804');

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
