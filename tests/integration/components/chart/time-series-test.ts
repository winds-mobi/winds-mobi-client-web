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

    await render(hbs`<Chart::TimeSeries @chartData={{this.chartData}} />`);

    assert.dom('.highcharts-container').exists();
  });

  test('it renders with no series data', async function (this: TimeSeriesTestContext, assert) {
    this.chartData = [];

    await render(hbs`<Chart::TimeSeries @chartData={{this.chartData}} />`);

    assert.dom('.highcharts-container').exists();
  });
});
