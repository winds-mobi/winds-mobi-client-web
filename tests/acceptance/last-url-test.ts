import { module, test } from 'qunit';
import { currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';

module('Acceptance | last url', function (hooks) {
  setupApplicationTest(hooks);

  test('it remembers the URL the app shows', async function (assert) {
    const storage = this.owner.lookup('service:tracked-local-storage');

    await visit('/settings');

    assert.strictEqual(storage.getItem('app.lastUrl'), '/settings');

    await visit('/help');

    assert.strictEqual(storage.getItem('app.lastUrl'), '/help');
  });

  test('a cold start at the root reopens the remembered URL', async function (assert) {
    this.owner
      .lookup('service:tracked-local-storage')
      .setItem('app.lastUrl', '/help');

    await visit('/');

    assert.strictEqual(currentURL(), '/help');
  });

  test('a cold start at an explicit URL opens that URL', async function (assert) {
    this.owner
      .lookup('service:tracked-local-storage')
      .setItem('app.lastUrl', '/help');

    await visit('/settings');

    assert.strictEqual(currentURL(), '/settings');
  });
});
