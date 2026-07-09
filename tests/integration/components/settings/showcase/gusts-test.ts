import { module, test } from 'qunit';
import { findAll, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

type Ctx = { enabled: boolean };

module('Integration | Component | settings/showcase/gusts', function (hooks) {
  setupRenderingTest(hooks);

  test('it draws the gusts hub only when enabled', async function (this: Ctx, assert) {
    this.enabled = false;

    await render(hbs`<Settings::Showcase::Gusts @enabled={{this.enabled}} />`);
    assert.strictEqual(findAll('path').length, 1);

    this.enabled = true;
    await render(hbs`<Settings::Showcase::Gusts @enabled={{this.enabled}} />`);
    assert.strictEqual(findAll('path').length, 2);
  });
});
