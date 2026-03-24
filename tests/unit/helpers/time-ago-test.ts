import { module, test } from 'qunit';
import type { TestContext } from '@ember/test-helpers';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import { renderTimeAgoText, timeAgoParts } from 'winds-mobi-client-web/helpers/time-ago';
import type IntlService from 'ember-intl/services/intl';

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
    const intl = this.owner.lookup('service:intl') as IntlService;

    assert.strictEqual(renderTimeAgoText(intl, 600), 'in 10 minutes');
  });
});
