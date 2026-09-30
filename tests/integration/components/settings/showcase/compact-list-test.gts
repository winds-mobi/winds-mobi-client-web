import { module, test } from 'qunit';
import { findAll, render } from '@ember/test-helpers';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import SettingsShowcaseCompactList from 'winds-mobi-client-web/components/settings/showcase/compact-list';
import { trackedObject } from '@ember/reactive/collections';

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
      const state = trackedObject({ enabled: false });

      await render(
        <template>
          <SettingsShowcaseCompactList @enabled={{state.enabled}} />
        </template>
      );

      const off = previewCards();
      assert.true(off.big?.classList.contains('opacity-100'));
      assert.true(off.compact?.classList.contains('opacity-40'));

      state.enabled = true;
      await render(
        <template>
          <SettingsShowcaseCompactList @enabled={{state.enabled}} />
        </template>
      );

      const on = previewCards();
      assert.true(on.big?.classList.contains('opacity-40'));
      assert.true(on.compact?.classList.contains('opacity-100'));
    });
  }
);
