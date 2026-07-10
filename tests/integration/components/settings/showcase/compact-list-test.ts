import { module, test } from 'qunit';
import { findAll, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

type Ctx = { enabled: boolean };

function previewCards() {
  const wrapper = findAll('div')[0];
  const [big, compact] = Array.from(wrapper?.children ?? []) as HTMLElement[];

  return { big, compact };
}

module(
  'Integration | Component | settings/showcase/compact-list',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it highlights the big card by default and the compact grid when enabled', async function (this: Ctx, assert) {
      this.enabled = false;

      await render(
        hbs`<Settings::Showcase::CompactList @enabled={{this.enabled}} />`
      );

      const off = previewCards();
      assert.true(off.big?.classList.contains('opacity-100'));
      assert.true(off.compact?.classList.contains('opacity-40'));

      this.enabled = true;
      await render(
        hbs`<Settings::Showcase::CompactList @enabled={{this.enabled}} />`
      );

      const on = previewCards();
      assert.true(on.big?.classList.contains('opacity-40'));
      assert.true(on.compact?.classList.contains('opacity-100'));
    });
  }
);
