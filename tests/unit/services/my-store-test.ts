import { module, test } from 'qunit';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';

module('Unit | Service | MyStore', function (hooks) {
  setupTest(hooks);

  // TODO: Replace this with your real tests.
  test('it exists', function (assert) {
    const service = this.owner.lookup('service:my-store');
    assert.ok(service);
  });
});
