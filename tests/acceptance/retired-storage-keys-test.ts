import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { RETIRED_STORAGE_KEYS } from 'winds-mobi-client-web/utils/retired-storage-keys';

module('Acceptance | retired storage keys', function (hooks) {
  setupApplicationTest(hooks);

  test('booting the app removes every retired key a returning visitor still has', async function (assert) {
    const storage = this.owner.lookup('service:tracked-local-storage');

    for (const key of RETIRED_STORAGE_KEYS) {
      storage.setItem(key, true);
    }

    await visit('/settings');

    for (const key of RETIRED_STORAGE_KEYS) {
      assert.strictEqual(
        window.localStorage.getItem(key),
        null,
        `${key} is gone from localStorage`
      );
    }
  });

  test('it leaves the settings the app still reads alone', async function (assert) {
    const settings = this.owner.lookup('service:settings');

    settings.useIconLabels = true;

    await visit('/settings');

    assert.true(settings.useIconLabels);
    assert.dom('[data-test-setting="useIconLabels"]').isChecked();
  });
});
