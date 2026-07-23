import { module, test } from 'qunit';
import { cardinalOnlyDirectionLabel } from 'winds-mobi-client-web/utils/compass-labels';

module('Unit | Utility | compass-labels', function () {
  test('it labels the 4 cardinal directions', function (assert) {
    assert.strictEqual(cardinalOnlyDirectionLabel(0), 'N');
    assert.strictEqual(cardinalOnlyDirectionLabel(90), 'E');
    assert.strictEqual(cardinalOnlyDirectionLabel(180), 'S');
    assert.strictEqual(cardinalOnlyDirectionLabel(270), 'W');
  });

  test('it drops the 4 diagonal directions', function (assert) {
    assert.strictEqual(cardinalOnlyDirectionLabel(45), '');
    assert.strictEqual(cardinalOnlyDirectionLabel(135), '');
    assert.strictEqual(cardinalOnlyDirectionLabel(225), '');
    assert.strictEqual(cardinalOnlyDirectionLabel(315), '');
  });

  test('it wraps a full-circle value back to N', function (assert) {
    assert.strictEqual(cardinalOnlyDirectionLabel(360), 'N');
  });
});
