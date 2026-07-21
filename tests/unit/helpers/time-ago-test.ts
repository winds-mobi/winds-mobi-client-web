import { module, test } from 'qunit';
import type { TestContext } from '@ember/test-helpers';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import {
  compactTimeAgo,
  renderTimeAgoText,
  timeAgoParts,
} from 'winds-mobi-client-web/helpers/time-ago';

module('Unit | Helper | time-ago', function (hooks) {
  setupTest(hooks);

  test('it picks larger units for larger offsets', function (assert) {
    assert.deepEqual(timeAgoParts(45), {
      value: 45,
      unit: 'second',
    });
    assert.deepEqual(timeAgoParts(600), {
      value: 10,
      unit: 'minute',
    });
    assert.deepEqual(timeAgoParts(7200), {
      value: 2,
      unit: 'hour',
    });
  });

  test('it formats relative text through ember-intl', function (this: TestContext, assert) {
    const intl = this.owner.lookup('service:intl');

    assert.strictEqual(renderTimeAgoText(intl, 600), 'in 10m');
  });

  test('compactTimeAgo drops the "ago"/unit wording, keeping just a number and a unit letter', function (assert) {
    assert.strictEqual(compactTimeAgo(45), '45s');
    assert.strictEqual(compactTimeAgo(600), '10m');
    assert.strictEqual(compactTimeAgo(7200), '2h');
    assert.strictEqual(compactTimeAgo(3 * 86400), '3d');
    assert.strictEqual(compactTimeAgo(2 * 2629800), '2mo');
  });

  test('compactTimeAgo treats a future offset the same as a past one', function (assert) {
    assert.strictEqual(compactTimeAgo(-600), '10m');
  });
});
