import { module, test } from 'qunit';
import { render, type RenderingTestContext } from '@ember/test-helpers';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import SettingsShowcaseWindDirection from 'winds-mobi-client-web/components/settings/showcase/wind-direction';

// Wind direction is a setting, off by default -- see the identical helper in
// tests/integration/components/station/wind/presenter-test.ts.
function enableWindDirection(context: RenderingTestContext) {
  context.owner.lookup('service:settings').windDirectionHistoryEnabled = true;
}

module(
  'Integration | Component | settings/showcase/wind-direction',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders no Direction series when the setting is off', async function (assert) {
      await render(<template><SettingsShowcaseWindDirection /></template>);

      const Highcharts = (await import('highcharts')).default;
      const chart = Highcharts.charts.findLast((c) => c?.container);

      assert.dom('.highcharts-container').exists();
      assert.notOk(chart?.series.some((s) => s.name === 'Direction'));
    });

    // Confirms the real windbarb series renders with the sample data once
    // the setting is on -- this preview reuses Station::Wind::Presenter
    // directly, so it's exercising the exact same component/config the real
    // station panel does.
    test('it renders a real windbarb series once the setting is on', async function (this: RenderingTestContext, assert) {
      enableWindDirection(this);

      await render(<template><SettingsShowcaseWindDirection /></template>);

      const Highcharts = (await import('highcharts')).default;
      const chart = Highcharts.charts.findLast((c) =>
        c?.series.some((s) => s.name === 'Direction')
      );
      const series = chart?.series.find((s) => s.name === 'Direction');

      assert.strictEqual(series?.data.length, 5);
    });
  }
);
