import { module, test } from 'qunit';
import { findAll, render } from '@ember/test-helpers';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import SettingsShowcaseGusts from 'winds-mobi-client-web/components/settings/showcase/gusts';
import { trackedObject } from '@ember/reactive/collections';

type Ctx = { enabled: boolean };

module('Integration | Component | settings/showcase/gusts', function (hooks) {
  setupRenderingTest(hooks);

  test('it draws the gusts hub only when enabled', async function (this: Ctx, assert) {
    const state = trackedObject({ enabled: false });

    await render(
      <template><SettingsShowcaseGusts @enabled={{state.enabled}} /></template>
    );
    assert.strictEqual(findAll('path').length, 1);

    state.enabled = true;
    await render(
      <template><SettingsShowcaseGusts @enabled={{state.enabled}} /></template>
    );
    assert.strictEqual(findAll('path').length, 2);
  });
});
