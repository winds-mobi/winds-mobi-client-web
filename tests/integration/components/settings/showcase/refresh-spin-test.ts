import { module, test } from 'qunit';
import { click, render, settled } from '@ember/test-helpers';
import { set } from '@ember/object';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

type Ctx = { enabled: boolean };

module(
  'Integration | Component | settings/showcase/refresh-spin',
  function (hooks) {
    setupRenderingTest(hooks);

    test('turning the preference on spins the demo button immediately, and pressing it spins again', async function (this: Ctx, assert) {
      this.enabled = false;

      await render(
        hbs`<Settings::Showcase::RefreshSpin @enabled={{this.enabled}} />`
      );

      assert
        .dom('button span')
        .hasAttribute('style', /rotate\(0deg\)/, 'no spin while disabled');

      await click('button');
      assert
        .dom('button span')
        .hasAttribute(
          'style',
          /rotate\(0deg\)/,
          'pressing it while disabled does nothing'
        );

      set(this, 'enabled', true);
      await settled();

      assert
        .dom('button span')
        .hasAttribute(
          'style',
          /rotate\(360deg\)/,
          'enabling the preference spins the demo button on its own, with no press needed'
        );

      await click('button');
      assert
        .dom('button span')
        .hasAttribute(
          'style',
          /rotate\(720deg\)/,
          'pressing it while enabled adds another turn on top'
        );
    });

    test('turning the preference back off unwinds only its own turn, keeping any presses; re-enabling adds a turn again', async function (this: Ctx, assert) {
      this.enabled = true;

      await render(
        hbs`<Settings::Showcase::RefreshSpin @enabled={{this.enabled}} />`
      );
      assert
        .dom('button span')
        .hasAttribute('style', /rotate\(360deg\)/, 'spins once when enabled');

      await click('button');
      assert
        .dom('button span')
        .hasAttribute('style', /rotate\(720deg\)/, 'a press adds a turn');

      set(this, 'enabled', false);
      await settled();

      assert
        .dom('button span')
        .hasAttribute(
          'style',
          /rotate\(360deg\)/,
          "disabling only unwinds its own turn -- the earlier press's turn is kept"
        );

      set(this, 'enabled', true);
      await settled();

      assert
        .dom('button span')
        .hasAttribute(
          'style',
          /rotate\(720deg\)/,
          're-enabling adds its turn back'
        );
    });
  }
);
