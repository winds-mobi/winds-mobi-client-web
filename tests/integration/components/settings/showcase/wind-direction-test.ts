import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

type Ctx = { enabled: boolean };

module(
  'Integration | Component | settings/showcase/wind-direction',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders no chart when disabled', async function (this: Ctx, assert) {
      this.enabled = false;

      await render(
        hbs`<Settings::Showcase::WindDirection @enabled={{this.enabled}} />`
      );

      assert.dom('.highcharts-container').doesNotExist();
    });

    // Confirms this renders the *real* windbarb series (this app's own
    // data-flow contract into it), not just that a chart of some kind
    // exists -- see CLAUDE.md's Testing section on why this is testing us,
    // not Highcharts.
    test('it renders a real windbarb series with sample readings when enabled', async function (this: Ctx, assert) {
      this.enabled = true;

      await render(
        hbs`<Settings::Showcase::WindDirection @enabled={{this.enabled}} />`
      );

      assert.dom('.highcharts-container').exists();

      const Highcharts = (await import('highcharts')).default;
      const chart = Highcharts.charts.findLast((c) =>
        c?.series.some((s) => s.name === 'Direction')
      );
      const series = chart?.series.find((s) => s.name === 'Direction');

      assert.deepEqual(
        series?.data.map(
          (p) => (p as unknown as { direction: number }).direction
        ),
        [20, 110, 250]
      );
    });
  }
);
