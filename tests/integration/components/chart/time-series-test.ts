import { module, test } from 'qunit';
import { render, type RenderingTestContext } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { TimeSeriesPoint } from 'winds-mobi-client-web/utils/chart-series';

interface TimeSeriesTestContext extends RenderingTestContext {
  chartData: { name: string; data: TimeSeriesPoint[] }[];
}

// This is the shared chart shell every station history chart (wind, air)
// renders through. Drawing/configuring is Highcharts' responsibility, not
// ours, so these tests only check that the component accepts @chartData and
// renders without error.
module('Integration | Component | chart/time-series', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders with series data', async function (this: TimeSeriesTestContext, assert) {
    const now = Date.now();

    this.chartData = [
      {
        name: 'Wind',
        data: [
          [now - 30 * 60 * 1000, 10],
          [now - 5 * 60 * 1000, 16],
        ],
      },
    ];

    await render(
      hbs`<Chart::TimeSeries @chartData={{this.chartData}} @stationId="holfuy-1829" />`
    );

    assert.dom('.highcharts-container').exists();
  });

  test('it renders with no series data', async function (this: TimeSeriesTestContext, assert) {
    this.chartData = [];

    await render(
      hbs`<Chart::TimeSeries @chartData={{this.chartData}} @stationId="holfuy-1829" />`
    );

    assert.dom('.highcharts-container').exists();
  });

  // Highcharts 13 auto-follows the OS/browser's prefers-color-scheme by
  // default (`palette.colorScheme` defaults to `'light dark'`), which would
  // otherwise silently switch this chart to a dark palette on a device set
  // to dark mode. `defaultChartOptions` pins `palette.colorScheme` to
  // `'light'`, which Highcharts reflects as an inline `color-scheme: light`
  // style on its own wrapper (`.highcharts-container`) -- reading that
  // confirms our option actually reached and took effect on the real chart,
  // not just that we passed it.
  test('it pins the chart to light mode regardless of the OS/browser color scheme preference', async function (this: TimeSeriesTestContext, assert) {
    this.chartData = [{ name: 'Wind', data: [[Date.now(), 10]] }];

    await render(
      hbs`<Chart::TimeSeries @chartData={{this.chartData}} @stationId="holfuy-1829" />`
    );

    assert
      .dom('.highcharts-container')
      .hasAttribute('style', /color-scheme:\s*light/);
  });
});
