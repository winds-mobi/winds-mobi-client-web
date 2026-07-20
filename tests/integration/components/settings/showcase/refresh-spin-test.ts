import { module, test } from 'qunit';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

type Ctx = { enabled: boolean };

module(
  'Integration | Component | settings/showcase/refresh-spin',
  function (hooks) {
    setupRenderingTest(hooks);

    test('pressing the demo button plays the spin only when enabled', async function (this: Ctx, assert) {
      this.enabled = false;

      await render(
        hbs`<Settings::Showcase::RefreshSpin @enabled={{this.enabled}} />`
      );
      await click('button');

      assert.dom('button span').hasAttribute('style', /rotate\(0deg\)/);

      this.enabled = true;
      await render(
        hbs`<Settings::Showcase::RefreshSpin @enabled={{this.enabled}} />`
      );
      await click('button');

      assert.dom('button span').hasAttribute('style', /rotate\(360deg\)/);
    });
  }
);
