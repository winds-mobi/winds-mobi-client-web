import { module, test } from 'qunit';
import { render, type RenderingTestContext } from '@ember/test-helpers';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import StationUpdatedMeta from 'winds-mobi-client-web/components/station/updated-meta';

interface StationUpdatedMetaTestContext extends RenderingTestContext {
  timestamp: number;
  isCompact?: boolean;
}

module('Integration | Component | station/updated-meta', function (hooks) {
  setupRenderingTest(hooks);

  test('by default it shows the clock icon and a full "ago" reading', async function (this: StationUpdatedMetaTestContext, assert) {
    const timestamp: StationUpdatedMetaTestContext['timestamp'] =
      Date.now() - 5 * 60 * 1000;

    await render(
      <template><StationUpdatedMeta @timestamp={{timestamp}} /></template>
    );

    assert.dom('svg').exists('the clock icon is shown');
    assert.dom('dd').hasText('5m ago');
  });

  test('in compact mode it hides the icon and drops the "ago" wording', async function (this: StationUpdatedMetaTestContext, assert) {
    const timestamp: StationUpdatedMetaTestContext['timestamp'] =
      Date.now() - 5 * 60 * 1000;
    const isCompact: StationUpdatedMetaTestContext['isCompact'] = true;

    await render(
      <template>
        <StationUpdatedMeta @timestamp={{timestamp}} @isCompact={{isCompact}} />
      </template>
    );

    assert.dom('svg').doesNotExist('no icon in compact mode');
    assert.dom('dd').hasText('5m');
  });

  test('compact mode applies its own smaller, muted sizing', async function (this: StationUpdatedMetaTestContext, assert) {
    const timestamp: StationUpdatedMetaTestContext['timestamp'] =
      Date.now() - 5 * 60 * 1000;
    const isCompact: StationUpdatedMetaTestContext['isCompact'] = true;

    await render(
      <template>
        <StationUpdatedMeta @timestamp={{timestamp}} @isCompact={{isCompact}} />
      </template>
    );

    assert.dom('dd').hasClass('text-[11px]').hasClass('text-slate-500');
  });
});
