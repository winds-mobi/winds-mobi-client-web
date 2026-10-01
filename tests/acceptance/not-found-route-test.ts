import { module, test } from 'qunit';
import { currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { setupStubbedApi } from 'winds-mobi-client-web/tests/helpers/stub-api';

module('Acceptance | not-found route', function (hooks) {
  setupApplicationTest(hooks);
  setupStubbedApi(hooks);

  test('an old pre-rebuild station URL redirects to the map', async function (assert) {
    await visit('/stations/holfuy-1804');

    assert.strictEqual(currentURL(), '/all');
  });

  test('an unrecognized path redirects to the map', async function (assert) {
    await visit('/this/path/does/not/exist');

    assert.strictEqual(currentURL(), '/all');
  });
});
