import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

type RelativeTimeTestContext = {
  originalDateNow: typeof Date.now;
  timestamp: number;
};

module('Integration | Component | relative-time', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function (this: RelativeTimeTestContext) {
    this.originalDateNow = Date.now;
    Date.now = () => 1_710_000_000_000;
  });

  hooks.afterEach(function (this: RelativeTimeTestContext) {
    Date.now = this.originalDateNow;
  });

  test('it formats epoch seconds safely', async function (this: RelativeTimeTestContext, assert) {
    this.timestamp = 1_710_000_000;

    await render(hbs`<RelativeTime @timestamp={{this.timestamp}} />`);

    assert.dom().doesNotIncludeText('-');
  });

  test('it formats epoch milliseconds safely', async function (this: RelativeTimeTestContext, assert) {
    this.timestamp = 1_710_000_000_000;

    await render(hbs`<RelativeTime @timestamp={{this.timestamp}} />`);

    assert.dom().doesNotIncludeText('-');
  });

  test('it falls back when timestamp is invalid', async function (this: RelativeTimeTestContext, assert) {
    this.timestamp = Number.NaN;

    await render(hbs`<RelativeTime @timestamp={{this.timestamp}} />`);

    assert.dom().hasText('-');
  });
});
