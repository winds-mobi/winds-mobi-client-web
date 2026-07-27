import { module, test } from 'qunit';
import { render, type RenderingTestContext } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

// Wind direction is a beta feature, off by default -- see the identical
// helper in tests/integration/components/station/wind/presenter-test.ts.
function enableWindDirectionBeta(context: RenderingTestContext) {
  const settings = context.owner.lookup('service:settings');
  settings.betaFeaturesEnabled = true;
  settings.windDirectionHistoryEnabled = true;
}

module(
  'Integration | Component | settings/showcase/wind-direction',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders no Direction series when the beta feature is off', async function (assert) {
      await render(hbs`<Settings::Showcase::WindDirection />`);

      const Highcharts = (await import('highcharts')).default;
      const chart = Highcharts.charts.findLast((c) => c?.container);

      assert.dom('.highcharts-container').exists();
      assert.notOk(chart?.series.some((s) => s.name === 'Direction'));
    });

    // Confirms the real windbarb series renders with the sample data once
    // the beta feature is on -- this preview reuses Station::Wind::Presenter
    // directly, so it's exercising the exact same component/config the real
    // station panel does.
    test('it renders a real windbarb series once the beta feature is on', async function (this: RenderingTestContext, assert) {
      enableWindDirectionBeta(this);

      await render(hbs`<Settings::Showcase::WindDirection />`);

      const Highcharts = (await import('highcharts')).default;
      const chart = Highcharts.charts.findLast((c) =>
        c?.series.some((s) => s.name === 'Direction')
      );
      const series = chart?.series.find((s) => s.name === 'Direction');

      assert.strictEqual(series?.data.length, 5);
    });
  }
);
