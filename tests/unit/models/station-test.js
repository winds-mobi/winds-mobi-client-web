import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import { module, test } from 'qunit';

module('Unit | Model | station', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('station', {});
    assert.ok(model, 'model exists');
  });
});
