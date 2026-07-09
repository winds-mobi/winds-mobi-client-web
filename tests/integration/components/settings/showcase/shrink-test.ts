import { module, test } from 'qunit';
import { findAll, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

type Ctx = { enabled: boolean };

function sampleTransforms() {
  return findAll('svg g').map((g) => g.getAttribute('transform') ?? '');
}

module('Integration | Component | settings/showcase/shrink', function (hooks) {
  setupRenderingTest(hooks);

  test('every sample stays full size when disabled', async function (this: Ctx, assert) {
    this.enabled = false;

    await render(hbs`<Settings::Showcase::Shrink @enabled={{this.enabled}} />`);

    const transforms = sampleTransforms();

    assert.strictEqual(transforms.length, 4);
    assert.true(transforms.every((transform) => !transform.includes('scale')));
  });

  test('older samples shrink when enabled', async function (this: Ctx, assert) {
    this.enabled = true;

    await render(hbs`<Settings::Showcase::Shrink @enabled={{this.enabled}} />`);

    const [now, tenMin, twentyMin, thirtyMin] = sampleTransforms();

    assert.false(now?.includes('scale'), 'the "now" sample is full size');
    assert.true(tenMin?.includes('scale'));
    assert.true(twentyMin?.includes('scale'));
    assert.true(
      thirtyMin?.includes('scale(0.5)'),
      'the oldest sample holds the floor scale'
    );
  });
});
