import { module, test } from 'qunit';
import { click, currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import {
  setupStubbedApi,
  stationsApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import { OVERLAPPING_STATIONS } from 'winds-mobi-client-web/tests/helpers/station-fixture';

const HIDDEN_CARD_SELECTOR = '[data-test-nearby-station-card]';

module('Acceptance | hidden stations', function (hooks) {
  setupApplicationTest(hooks);
  const api = setupStubbedApi(hooks);

  hooks.beforeEach(function () {
    api.respond = stationsApi({ stations: OVERLAPPING_STATIONS });
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;
    this.owner.lookup('service:settings').hiddenStationsFeatureEnabled = true;
  });

  test('the navbar does not link to the hidden page', async function (assert) {
    await visit('/hidden');

    assert.dom('[data-test-navbar-link="hidden"]').doesNotExist();

    await click('[data-test-navbar-mobile-menu-button]');

    assert
      .dom('[data-test-navbar-mobile-menu] [data-test-navbar-link="hidden"]')
      .doesNotExist();
  });

  test('a card on the page unhides its station', async function (assert) {
    const hiddenStations = this.owner.lookup('service:hidden-stations');

    hiddenStations.add('slf-PMA2');

    await visit('/hidden');

    await click(`${HIDDEN_CARD_SELECTOR} [data-test-station-hide]`);

    assert.deepEqual(hiddenStations.stationIds, []);
  });

  test('settings lists the hidden stations and links to the hidden page', async function (assert) {
    const hiddenStations = this.owner.lookup('service:hidden-stations');

    hiddenStations.add('slf-PMA2');

    await visit('/settings');

    assert
      .dom('[data-test-settings-hidden-station="slf-PMA2"]')
      .includesText('Colms da Parsonz');

    await click('[data-test-settings-hidden-link]');

    assert.strictEqual(currentURL(), '/hidden');
  });

  test('settings shows an empty note when nothing is hidden', async function (assert) {
    await visit('/settings');

    assert.dom('[data-test-settings-hidden-empty]').exists();
    assert.dom('[data-test-settings-hidden-link]').exists();
  });

  test('settings has no hidden-stations box while the feature is off', async function (assert) {
    this.owner.lookup('service:settings').hiddenStationsFeatureEnabled = false;

    await visit('/settings');

    assert.dom('[data-test-settings-hidden-stations]').doesNotExist();
  });
});
