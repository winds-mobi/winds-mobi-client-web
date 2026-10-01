import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import SettingsShowcaseFavicon from 'winds-mobi-client-web/components/settings/showcase/favicon';
import { trackedObject } from '@ember/reactive/collections';

type Ctx = { enabled: boolean };

module('Integration | Component | settings/showcase/favicon', function (hooks) {
  setupRenderingTest(hooks);

  test('it shows the wind arrow when enabled and the default favicon otherwise', async function (this: Ctx, assert) {
    const state = trackedObject({ enabled: true });

    await render(
      <template>
        <SettingsShowcaseFavicon @enabled={{state.enabled}} />
      </template>
    );

    assert.dom('svg').exists();
    assert.dom('img').doesNotExist();

    state.enabled = false;
    await render(
      <template>
        <SettingsShowcaseFavicon @enabled={{state.enabled}} />
      </template>
    );

    assert.dom('svg').doesNotExist();
    assert.dom('img').hasAttribute('src', '/favicon.ico');
  });
});
