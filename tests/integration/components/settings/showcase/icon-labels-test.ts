import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

type Ctx = { enabled: boolean };

module(
  'Integration | Component | settings/showcase/icon-labels',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it shows text labels when disabled and icons when enabled', async function (this: Ctx, assert) {
      this.enabled = false;

      await render(
        hbs`<Settings::Showcase::IconLabels @enabled={{this.enabled}} />`
      );
      assert.dom(this.element).includesText('Temperature');
      assert.dom(this.element).includesText('Humidity');
      assert.dom('svg').doesNotExist();

      this.enabled = true;
      await render(
        hbs`<Settings::Showcase::IconLabels @enabled={{this.enabled}} />`
      );
      assert.dom('svg').exists({ count: 2 });
    });
  }
);
