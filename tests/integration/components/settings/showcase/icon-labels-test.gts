import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import {
  setupRenderingTest,
  type RenderedTestContext,
} from 'winds-mobi-client-web/tests/helpers';
import SettingsShowcaseIconLabels from 'winds-mobi-client-web/components/settings/showcase/icon-labels';
import { trackedObject } from '@ember/reactive/collections';

interface Ctx extends RenderedTestContext {
  enabled: boolean;
}

module(
  'Integration | Component | settings/showcase/icon-labels',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it shows text labels when disabled and icons when enabled', async function (this: Ctx, assert) {
      const state = trackedObject({ enabled: false });

      await render(
        <template>
          <SettingsShowcaseIconLabels @enabled={{state.enabled}} />
        </template>
      );
      assert.dom(this.element).includesText('Temperature');
      assert.dom(this.element).includesText('Humidity');
      assert.dom('svg').doesNotExist();

      state.enabled = true;
      await render(
        <template>
          <SettingsShowcaseIconLabels @enabled={{state.enabled}} />
        </template>
      );
      assert.dom('svg').exists({ count: 2 });
    });
  }
);
