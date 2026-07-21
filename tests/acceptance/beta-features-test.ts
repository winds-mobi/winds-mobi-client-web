import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, findAll, visit, waitFor } from '@ember/test-helpers';
import { Type } from '@warp-drive/core/types/symbols';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import type { Station } from 'winds-mobi-client-web/services/store';

// The favourites view, the favourite heart, and the refresh button's one-off
// spin are beta features (see app/services/settings.ts): hidden/inert by
// default, revealed/enabled once a visitor opts into "Enable beta features"
// in Settings. This file covers the gating itself; the features' own
// behaviour once visible is covered by favorites-route-test.ts,
// station-favorite-test.ts, and refresh-control-test.ts.

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

module('Acceptance | beta features gating', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('the favourites nav link is hidden by default', async function (assert) {
    await visit('/map/holfuy-1804');

    assert.dom('[data-test-navbar-link="favorites"]').doesNotExist();

    await click('[data-test-navbar-mobile-menu-button]');
    assert
      .dom('[data-test-navbar-mobile-menu] [data-test-navbar-link="favorites"]')
      .doesNotExist();
  });

  test('the favourite heart is hidden by default', async function (assert) {
    await visit('/map/holfuy-1804');

    assert.dom('[data-test-station-title]').exists();
    assert.dom('[data-test-station-favorite]').doesNotExist();
  });

  test('enabling beta features in settings reveals the favourites nav link', async function (assert) {
    await visit('/settings');

    assert.dom('[data-test-navbar-link="favorites"]').doesNotExist();

    await click('[data-test-setting="betaFeaturesEnabled"]');

    assert.dom('[data-test-navbar-link="favorites"]').exists();
  });

  test('enabling beta features reveals the favourite heart', async function (assert) {
    await visit('/settings');

    await click('[data-test-setting="betaFeaturesEnabled"]');
    await visit('/map/holfuy-1804');
    await waitFor('[data-test-station-favorite]');

    assert.dom('[data-test-station-favorite]').exists();
  });

  test('the refresh-button-spin setting is hidden by default', async function (assert) {
    await visit('/settings');

    assert.dom('[data-test-setting="refreshButtonSpin"]').doesNotExist();
  });

  test('enabling beta features reveals the refresh-button-spin setting', async function (assert) {
    await visit('/settings');

    await click('[data-test-setting="betaFeaturesEnabled"]');

    assert.dom('[data-test-setting="refreshButtonSpin"]').isChecked();
  });

  test('the favourites-feature setting is hidden by default', async function (assert) {
    await visit('/settings');

    assert.dom('[data-test-setting="favoritesFeatureEnabled"]').doesNotExist();
  });

  test('enabling beta features reveals the favourites-feature setting, checked by default', async function (assert) {
    await visit('/settings');

    await click('[data-test-setting="betaFeaturesEnabled"]');

    assert.dom('[data-test-setting="favoritesFeatureEnabled"]').isChecked();
  });

  test('turning off the favourites-feature setting hides favourites even with beta features on', async function (assert) {
    await visit('/settings');

    await click('[data-test-setting="betaFeaturesEnabled"]');
    await click('[data-test-setting="favoritesFeatureEnabled"]');

    assert.dom('[data-test-navbar-link="favorites"]').doesNotExist();

    await visit('/map/holfuy-1804');

    assert.dom('[data-test-station-title]').exists();
    assert.dom('[data-test-station-favorite]').doesNotExist();
  });

  test('the master beta toggle sits above the individual beta features it reveals', async function (assert) {
    await visit('/settings');

    await click('[data-test-setting="betaFeaturesEnabled"]');

    const settingNames = findAll('[data-test-setting]').map((element) =>
      element.getAttribute('data-test-setting')
    );
    const betaIndex = settingNames.indexOf('betaFeaturesEnabled');

    assert.true(betaIndex >= 0, 'the master toggle is on the page');
    assert.true(
      betaIndex < settingNames.indexOf('favoritesFeatureEnabled'),
      'the master toggle comes before the favourites-feature toggle'
    );
    assert.true(
      betaIndex < settingNames.indexOf('refreshButtonSpin'),
      'the master toggle comes before the refresh-spin toggle'
    );
  });
});
