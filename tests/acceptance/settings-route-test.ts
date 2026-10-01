import { module, test } from 'qunit';
import {
  click,
  currentURL,
  findAll,
  type TestContext,
  visit,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { setupStubbedApi } from 'winds-mobi-client-web/tests/helpers/stub-api';

// `@ember/test-helpers` doesn't publicly export its `ApplicationTestContext`
// (only the base `TestContext` and `RenderingTestContext`), so acceptance
// tests that read `this.element` need this shape declared locally.
interface SettingsRouteTestContext extends TestContext {
  element?: Element | null;
}

module('Acceptance | settings route', function (hooks) {
  setupApplicationTest(hooks);
  setupStubbedApi(hooks);

  test('it shows every preference with its default: on, except icon labels, wind direction, and beta features', async function (this: SettingsRouteTestContext, assert) {
    await visit('/settings');

    assert.dom('[data-test-navbar-link="settings"]').hasText('Settings');
    assert.dom('[data-test-setting="faviconFollowsStation"]').isChecked();
    assert.dom('[data-test-setting="showGustsOutline"]').isChecked();
    assert.dom('[data-test-setting="shrinkOldData"]').isChecked();
    assert.dom('[data-test-setting="useIconLabels"]').isNotChecked();
    assert
      .dom('[data-test-setting="windDirectionHistoryEnabled"]')
      .isNotChecked('shown without enabling beta features, and off by default');
    assert.dom('[data-test-setting="betaFeaturesEnabled"]').isNotChecked();
    assert
      .dom(this.element)
      .includesText(
        'Beta features are early access. We do not guarantee they work correctly.'
      );

    const settingNames = findAll('[data-test-setting]').map((element) =>
      element.getAttribute('data-test-setting')
    );

    assert.strictEqual(
      settingNames[settingNames.length - 1],
      'betaFeaturesEnabled',
      'beta features is the last preference on the page'
    );
  });

  test('toggling a preference persists it to local storage', async function (assert) {
    await visit('/settings');

    await click('[data-test-setting="showGustsOutline"]');

    assert.dom('[data-test-setting="showGustsOutline"]').isNotChecked();
    assert.strictEqual(
      window.localStorage.getItem('settings.showGustsOutline'),
      'false',
      'the disabled preference is written to local storage'
    );

    // Back to the default removes the stored override.
    await click('[data-test-setting="showGustsOutline"]');

    assert.dom('[data-test-setting="showGustsOutline"]').isChecked();
    assert.strictEqual(
      window.localStorage.getItem('settings.showGustsOutline'),
      null,
      'restoring the default clears the stored override'
    );
  });

  test('the card-size choice is not a setting — it lives on each list itself', async function (assert) {
    await visit('/settings');

    assert.dom('[data-test-setting="nearbyCompactList"]').doesNotExist();
    assert.dom('[data-test-setting="favoritesCompactList"]').doesNotExist();
  });

  test('turning on beta features reveals the hide-stations toggle, off by default, instead of the nothing-in-beta note', async function (assert) {
    await visit('/settings');

    assert
      .dom('[data-test-setting="hiddenStationsFeatureEnabled"]')
      .doesNotExist();

    await click('[data-test-setting="betaFeaturesEnabled"]');

    assert
      .dom('[data-test-setting="hiddenStationsFeatureEnabled"]')
      .isNotChecked();
    assert.dom('[data-test-beta-features-empty]').doesNotExist();
  });

  test('it navigates to settings from the mobile menu without reloading', async function (assert) {
    await visit('/all');

    await click('[data-test-navbar-mobile-menu-button]');
    await click(
      '[data-test-navbar-mobile-menu] [data-test-navbar-link="settings"]'
    );

    assert.strictEqual(currentURL(), '/settings');
    assert.dom('[data-test-navbar-mobile-menu]').doesNotExist();
    assert.dom('[data-test-setting="faviconFollowsStation"]').exists();
  });
});
