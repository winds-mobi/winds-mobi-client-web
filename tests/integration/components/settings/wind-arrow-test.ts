import { module, test } from 'qunit';
import { find, findAll, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';
import { stationArrowGeometry } from 'winds-mobi-client-web/utils/station-arrow';

type SettingsWindArrowTestContext = {
  direction: number;
  speed: number;
  gusts: number;
  showGusts: boolean;
  scale?: number;
};

module('Integration | Component | settings/wind-arrow', function (hooks) {
  setupRenderingTest(hooks);

  test('it draws a single body with no hub when gusts are hidden', async function (this: SettingsWindArrowTestContext, assert) {
    this.direction = 90;
    this.speed = 12;
    this.gusts = 30;
    this.showGusts = false;

    await render(hbs`
      <Settings::WindArrow
        @direction={{this.direction}}
        @speed={{this.speed}}
        @gusts={{this.gusts}}
        @showGusts={{this.showGusts}}
      />
    `);

    assert.strictEqual(findAll('path').length, 1);
    assert.dom('path').hasAttribute('fill', windToColour(12));
  });

  test('it omits the hub when gusts share the average wind band', async function (this: SettingsWindArrowTestContext, assert) {
    this.direction = 90;
    this.speed = 12;
    this.gusts = 13;
    this.showGusts = true;

    await render(hbs`
      <Settings::WindArrow
        @direction={{this.direction}}
        @speed={{this.speed}}
        @gusts={{this.gusts}}
        @showGusts={{this.showGusts}}
      />
    `);

    assert.strictEqual(findAll('path').length, 1);
  });

  test('it draws a gusts-coloured hub when the bands differ', async function (this: SettingsWindArrowTestContext, assert) {
    this.direction = 90;
    this.speed = 12;
    this.gusts = 30;
    this.showGusts = true;

    await render(hbs`
      <Settings::WindArrow
        @direction={{this.direction}}
        @speed={{this.speed}}
        @gusts={{this.gusts}}
        @showGusts={{this.showGusts}}
      />
    `);

    const paths = findAll('path');
    assert.strictEqual(paths.length, 2);
    assert.strictEqual(paths[0]?.getAttribute('fill'), windToColour(30));
    assert.strictEqual(paths[1]?.getAttribute('fill'), windToColour(12));
  });

  test('it rotates to the wind direction and includes a scale transform when given', async function (this: SettingsWindArrowTestContext, assert) {
    this.direction = 45;
    this.speed = 12;
    this.gusts = 12;
    this.showGusts = false;
    this.scale = 0.5;

    await render(hbs`
      <Settings::WindArrow
        @direction={{this.direction}}
        @speed={{this.speed}}
        @gusts={{this.gusts}}
        @showGusts={{this.showGusts}}
        @scale={{this.scale}}
      />
    `);

    const geometry = stationArrowGeometry(false);
    const transform = find('g')?.getAttribute('transform');

    assert.true(transform?.includes(`rotate(225 ${geometry.rotationCentre})`));
    assert.true(transform?.includes('scale(0.5)'));
  });
});
