import { module, test } from 'qunit';
import { click, render, type RenderingTestContext } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type SettingsService from 'winds-mobi-client-web/services/settings';

interface SettingsRowTestContext extends RenderingTestContext {
  settings: SettingsService;
}

module('Integration | Component | settings/row', function (hooks) {
  setupRenderingTest(hooks);

  test('it reflects and toggles the named preference', async function (this: SettingsRowTestContext, assert) {
    this.settings = this.owner.lookup('service:settings');

    await render(
      hbs`<Settings::Row @settings={{this.settings}} @name="showGustsOutline" />`
    );

    assert.dom('[data-test-setting="showGustsOutline"]').isChecked();
    assert
      .dom(this.element)
      .includesText('Highlight gusts in the arrow centre');

    await click('[data-test-setting="showGustsOutline"]');

    assert.dom('[data-test-setting="showGustsOutline"]').isNotChecked();
    assert.false(this.settings.showGustsOutline);
  });

  test('it yields the showcase block', async function (this: SettingsRowTestContext, assert) {
    this.settings = this.owner.lookup('service:settings');

    await render(hbs`
      <Settings::Row @settings={{this.settings}} @name="showGustsOutline">
        <span data-test-showcase>preview</span>
      </Settings::Row>
    `);

    assert.dom('[data-test-showcase]').hasText('preview');
  });
});
