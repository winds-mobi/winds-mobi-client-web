import { module, test } from 'qunit';
import type { TestContext } from '@ember/test-helpers';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import { renderDistanceKmText } from 'winds-mobi-client-web/helpers/format-distance-km';

module('Unit | Helper | format-distance-km', function (hooks) {
  setupTest(hooks);

  test('it returns undefined when any coordinate is missing', function (this: TestContext, assert) {
    const intl = this.owner.lookup('service:intl');

    assert.strictEqual(
      renderDistanceKmText(intl, undefined, 6.632, 47.377, 8.542),
      undefined
    );
    assert.strictEqual(
      renderDistanceKmText(intl, 46.521, undefined, 47.377, 8.542),
      undefined
    );
    assert.strictEqual(
      renderDistanceKmText(intl, 46.521, 6.632, undefined, 8.542),
      undefined
    );
    assert.strictEqual(
      renderDistanceKmText(intl, 46.521, 6.632, 47.377, undefined),
      undefined
    );
  });

  test('it formats the distance with a unit suffix', function (this: TestContext, assert) {
    const intl = this.owner.lookup('service:intl');

    // Geneva to Zurich, ~224km.
    const text = renderDistanceKmText(intl, 46.2044, 6.1432, 47.3769, 8.5417);

    assert.true(text?.endsWith(' km'));
    assert.strictEqual(text, '224 km');
  });

  test('it keeps a decimal place under 10km', function (this: TestContext, assert) {
    const intl = this.owner.lookup('service:intl');

    const text = renderDistanceKmText(
      intl,
      46.521,
      6.632,
      46.521,
      6.642 // ~0.8km east
    );

    assert.strictEqual(text, '0.8 km');
  });
});
