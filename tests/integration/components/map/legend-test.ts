import { module, test } from 'qunit';
import { findAll, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { WindLegendBand } from 'winds-mobi-client-web/components/map/legend';

type MapLegendTestContext = {
  bands: WindLegendBand[];
};

module('Integration | Component | map/legend', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the title and one entry per band', async function (this: MapLegendTestContext, assert) {
    this.bands = [
      { backgroundClass: 'bg-wind-05', label: '5' },
      { backgroundClass: 'bg-wind-10', label: '10' },
      { backgroundClass: 'bg-wind-50', label: '45+' },
    ];

    await render(
      hbs`<Map::Legend @title="Wind speed" @bands={{this.bands}} />`
    );

    assert.dom('[data-test-map-wind-legend] p').hasText('Wind speed');

    const items = findAll('[data-test-map-wind-legend] li');
    assert.strictEqual(items.length, 3);
    assert.strictEqual(items[0]?.textContent?.trim(), '5');
    assert.true(items[0]?.classList.contains('bg-wind-05'));
    assert.strictEqual(items[2]?.textContent?.trim(), '45+');
    assert.true(items[2]?.classList.contains('bg-wind-50'));
  });
});
