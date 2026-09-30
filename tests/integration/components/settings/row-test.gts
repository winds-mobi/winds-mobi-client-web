import { module, test } from 'qunit';
import { click, render } from '@ember/test-helpers';
import {
  setupRenderingTest,
  type RenderedTestContext,
} from 'winds-mobi-client-web/tests/helpers';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import SettingsRow from 'winds-mobi-client-web/components/settings/row';

interface SettingsRowTestContext extends RenderedTestContext {
  settings: SettingsService;
}

module('Integration | Component | settings/row', function (hooks) {
  setupRenderingTest(hooks);

  test('it reflects and toggles the named preference', async function (this: SettingsRowTestContext, assert) {
    const settings: SettingsRowTestContext['settings'] =
      this.owner.lookup('service:settings');

    await render(
      <template>
        <SettingsRow @settings={{settings}} @name="showGustsOutline" />
      </template>
    );

    assert.dom('[data-test-setting="showGustsOutline"]').isChecked();
    assert
      .dom(this.element)
      .includesText('Highlight gusts in the arrow centre');

    await click('[data-test-setting="showGustsOutline"]');

    assert.dom('[data-test-setting="showGustsOutline"]').isNotChecked();
    assert.false(settings.showGustsOutline);
  });

  test('it yields the showcase block', async function (this: SettingsRowTestContext, assert) {
    const settings: SettingsRowTestContext['settings'] =
      this.owner.lookup('service:settings');

    await render(
      <template>
        <SettingsRow @settings={{settings}} @name="showGustsOutline">
          <span data-test-showcase>preview</span>
        </SettingsRow>
      </template>
    );

    assert.dom('[data-test-showcase]').hasText('preview');
  });
});
