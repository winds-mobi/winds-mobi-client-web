import { module, test } from 'qunit';
import { render, type RenderingTestContext } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import type { Point } from 'highcharts';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { History } from 'winds-mobi-client-web/services/store';

interface WindPresenterTestContext extends RenderingTestContext {
  history: History[];
}

// Highcharts' base `Point` type doesn't declare `direction` -- it's specific
// to the `windbarb` series type, not exposed in the base package's types.
interface WindbarbPointLike extends Point {
  direction: number;
}

// The wind/gusts series data itself is built by seriesFor (unit tested in
// tests/unit/utils/chart-series-test.ts). Drawing it is Highcharts'
// responsibility, not ours, so these tests only check that the component
// accepts `@history` and renders without error.
module('Integration | Component | station/wind/presenter', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the chart for recent history', async function (this: WindPresenterTestContext, assert) {
    const now = Date.now();

    this.history = [
      {
        id: 'history-1',
        direction: 180,
        speed: 10,
        gusts: 14,
        temperature: 6,
        humidity: 60,
        rain: 0,
        timestamp: now - 30 * 60 * 1000,
        [Type]: 'history',
      },
      {
        id: 'history-2',
        direction: 225,
        speed: 16,
        gusts: 22,
        temperature: 7,
        humidity: 58,
        rain: 0,
        timestamp: now - 5 * 60 * 1000,
        [Type]: 'history',
      },
    ];

    await render(
      hbs`<Station::Wind::Presenter @history={{this.history}} @stationId="holfuy-1829" />`
    );

    assert.dom('.highcharts-container').exists();
  });

  test('it renders the chart when there is no history', async function (this: WindPresenterTestContext, assert) {
    this.history = [];

    await render(
      hbs`<Station::Wind::Presenter @history={{this.history}} @stationId="holfuy-1829" />`
    );

    assert.dom('.highcharts-container').exists();
  });

  // Unlike the render-without-error checks above, this reads real Highcharts
  // state to confirm *our* data-flow contract: that a Direction series
  // reaches the chart with one windbarb point per history row, each with
  // the reading's own direction. See CLAUDE.md's Testing section on why
  // this is testing us, not Highcharts.
  test('it feeds a windbarb point per reading to a Direction series', async function (this: WindPresenterTestContext, assert) {
    const now = Date.now();

    this.history = [
      {
        id: 'history-1',
        direction: 180,
        speed: 10,
        gusts: 14,
        temperature: 6,
        humidity: 60,
        rain: 0,
        timestamp: now - 30 * 60 * 1000,
        [Type]: 'history',
      },
      {
        id: 'history-2',
        direction: 225,
        speed: 16,
        gusts: 22,
        temperature: 7,
        humidity: 58,
        rain: 0,
        timestamp: now - 5 * 60 * 1000,
        [Type]: 'history',
      },
    ];

    await render(
      hbs`<Station::Wind::Presenter @history={{this.history}} @stationId="holfuy-1829" />`
    );

    const Highcharts = (await import('highcharts')).default;
    const chart = Highcharts.charts.findLast((c) =>
      c?.series.some((s) => s.name === 'Direction')
    );
    const series = chart?.series.find((s) => s.name === 'Direction');

    assert.deepEqual(
      (series?.data as WindbarbPointLike[] | undefined)?.map(
        (p) => p.direction
      ),
      [180, 225]
    );
  });
});
