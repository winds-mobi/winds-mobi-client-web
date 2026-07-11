import Service from '@ember/service';
import { module, test } from 'qunit';
import {
  click,
  currentURL,
  findAll,
  type TestContext,
  visit,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';

// The settings route doesn't fetch stations, but the shared navbar is always
// rendered; a no-op store keeps any incidental request from failing.
class FakeStoreService extends Service {
  request() {
    return Promise.resolve({ content: { data: [] } });
  }
}

// `@ember/test-helpers` doesn't publicly export its `ApplicationTestContext`
// (only the base `TestContext` and `RenderingTestContext`), so acceptance
// tests that read `this.element` need this shape declared locally.
interface SettingsRouteTestContext extends TestContext {
  element?: Element | null;
}

module('Acceptance | settings route', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('it shows the seven preferences, on by default except the compact nearby/favourite lists, icon labels, and beta features', async function (this: SettingsRouteTestContext, assert) {
    await visit('/settings');

    assert.dom('[data-test-navbar-link="settings"]').hasText('Settings');
    assert.dom('[data-test-setting="faviconFollowsStation"]').isChecked();
    assert.dom('[data-test-setting="showGustsOutline"]').isChecked();
    assert.dom('[data-test-setting="shrinkOldData"]').isChecked();
    assert.dom('[data-test-setting="nearbyCompactList"]').isNotChecked();
    assert.dom('[data-test-setting="favoritesCompactList"]').isNotChecked();
    assert.dom('[data-test-setting="useIconLabels"]').isNotChecked();
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

  test('toggling the compact nearby list preference persists it to local storage', async function (assert) {
    await visit('/settings');

    await click('[data-test-setting="nearbyCompactList"]');

    assert.dom('[data-test-setting="nearbyCompactList"]').isChecked();
    assert.strictEqual(
      window.localStorage.getItem('settings.nearbyCompactList'),
      'true',
      'the non-default preference is written to local storage'
    );

    await click('[data-test-setting="nearbyCompactList"]');

    assert.dom('[data-test-setting="nearbyCompactList"]').isNotChecked();
    assert.strictEqual(
      window.localStorage.getItem('settings.nearbyCompactList'),
      null,
      'restoring the default clears the stored override'
    );
  });

  test('toggling the compact favourites list preference persists it to local storage', async function (assert) {
    await visit('/settings');

    await click('[data-test-setting="favoritesCompactList"]');

    assert.dom('[data-test-setting="favoritesCompactList"]').isChecked();
    assert.strictEqual(
      window.localStorage.getItem('settings.favoritesCompactList'),
      'true',
      'the non-default preference is written to local storage'
    );

    await click('[data-test-setting="favoritesCompactList"]');

    assert.dom('[data-test-setting="favoritesCompactList"]').isNotChecked();
    assert.strictEqual(
      window.localStorage.getItem('settings.favoritesCompactList'),
      null,
      'restoring the default clears the stored override'
    );
  });

  test('it navigates to settings from the mobile menu without reloading', async function (assert) {
    await visit('/map');

    await click('[data-test-navbar-mobile-menu-button]');
    await click(
      '[data-test-navbar-mobile-menu] [data-test-navbar-link="settings"]'
    );

    assert.strictEqual(currentURL(), '/settings');
    assert.dom('[data-test-navbar-mobile-menu]').doesNotExist();
    assert.dom('[data-test-setting="faviconFollowsStation"]').exists();
  });
});
