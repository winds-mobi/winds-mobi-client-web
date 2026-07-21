import Service from '@ember/service';
import { module, test } from 'qunit';
import { currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';

class FakeStoreService extends Service {
  request() {
    return Promise.resolve({ content: { data: [] } });
  }
}

module('Acceptance | not-found route', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('an old pre-rebuild station URL redirects to the map', async function (assert) {
    await visit('/stations/holfuy-1804');

    assert.strictEqual(currentURL(), '/map');
  });

  test('an unrecognized path redirects to the map', async function (assert) {
    await visit('/this/path/does/not/exist');

    assert.strictEqual(currentURL(), '/map');
  });
});
