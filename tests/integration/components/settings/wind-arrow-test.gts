import { module, test } from 'qunit';
import {
  find,
  findAll,
  render,
  type RenderingTestContext,
} from '@ember/test-helpers';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';
import { stationArrowGeometry } from 'winds-mobi-client-web/utils/station-arrow';
import SettingsWindArrow from 'winds-mobi-client-web/components/settings/wind-arrow';

interface SettingsWindArrowTestContext extends RenderingTestContext {
  direction: number;
  speed: number;
  gusts: number;
  showGusts: boolean;
  scale?: number;
}

module('Integration | Component | settings/wind-arrow', function (hooks) {
  setupRenderingTest(hooks);

  test('it draws a single body with no hub when gusts are hidden', async function (this: SettingsWindArrowTestContext, assert) {
    const direction: SettingsWindArrowTestContext['direction'] = 90;
    const speed: SettingsWindArrowTestContext['speed'] = 12;
    const gusts: SettingsWindArrowTestContext['gusts'] = 30;
    const showGusts: SettingsWindArrowTestContext['showGusts'] = false;

    await render(
      <template>
        <SettingsWindArrow
          @direction={{direction}}
          @speed={{speed}}
          @gusts={{gusts}}
          @showGusts={{showGusts}}
        />
      </template>
    );

    assert.strictEqual(findAll('path').length, 1);
    assert.dom('path').hasAttribute('fill', windToColour(12));
  });

  test('it omits the hub when gusts share the average wind band', async function (this: SettingsWindArrowTestContext, assert) {
    const direction: SettingsWindArrowTestContext['direction'] = 90;
    const speed: SettingsWindArrowTestContext['speed'] = 12;
    const gusts: SettingsWindArrowTestContext['gusts'] = 13;
    const showGusts: SettingsWindArrowTestContext['showGusts'] = true;

    await render(
      <template>
        <SettingsWindArrow
          @direction={{direction}}
          @speed={{speed}}
          @gusts={{gusts}}
          @showGusts={{showGusts}}
        />
      </template>
    );

    assert.strictEqual(findAll('path').length, 1);
  });

  test('it draws a gusts-coloured hub when the bands differ', async function (this: SettingsWindArrowTestContext, assert) {
    const direction: SettingsWindArrowTestContext['direction'] = 90;
    const speed: SettingsWindArrowTestContext['speed'] = 12;
    const gusts: SettingsWindArrowTestContext['gusts'] = 30;
    const showGusts: SettingsWindArrowTestContext['showGusts'] = true;

    await render(
      <template>
        <SettingsWindArrow
          @direction={{direction}}
          @speed={{speed}}
          @gusts={{gusts}}
          @showGusts={{showGusts}}
        />
      </template>
    );

    const paths = findAll('path');
    assert.strictEqual(paths.length, 2);
    assert.strictEqual(paths[0]?.getAttribute('fill'), windToColour(30));
    assert.strictEqual(paths[1]?.getAttribute('fill'), windToColour(12));
  });

  test('it rotates to the wind direction and includes a scale transform when given', async function (this: SettingsWindArrowTestContext, assert) {
    const direction: SettingsWindArrowTestContext['direction'] = 45;
    const speed: SettingsWindArrowTestContext['speed'] = 12;
    const gusts: SettingsWindArrowTestContext['gusts'] = 12;
    const showGusts: SettingsWindArrowTestContext['showGusts'] = false;
    const scale: SettingsWindArrowTestContext['scale'] = 0.5;

    await render(
      <template>
        <SettingsWindArrow
          @direction={{direction}}
          @speed={{speed}}
          @gusts={{gusts}}
          @showGusts={{showGusts}}
          @scale={{scale}}
        />
      </template>
    );

    const geometry = stationArrowGeometry(false);
    const transform = find('g')?.getAttribute('transform');

    assert.true(transform?.includes(`rotate(225 ${geometry.rotationCentre})`));
    assert.true(transform?.includes('scale(0.5)'));
  });
});
