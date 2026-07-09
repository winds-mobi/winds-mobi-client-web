import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

type Ctx = { enabled: boolean };

module('Integration | Component | settings/showcase/favicon', function (hooks) {
  setupRenderingTest(hooks);

  test('it shows the wind arrow when enabled and the default favicon otherwise', async function (this: Ctx, assert) {
    this.enabled = true;

    await render(
      hbs`<Settings::Showcase::Favicon @enabled={{this.enabled}} />`
    );

    assert.dom('svg').exists();
    assert.dom('img').doesNotExist();

    this.enabled = false;
    await render(
      hbs`<Settings::Showcase::Favicon @enabled={{this.enabled}} />`
    );

    assert.dom('svg').doesNotExist();
    assert.dom('img').hasAttribute('src', '/favicon.ico');
  });
});
