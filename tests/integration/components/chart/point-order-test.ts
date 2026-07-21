import { module, test } from 'qunit';
import { render, type RenderingTestContext } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { History } from 'winds-mobi-client-web/services/store';

interface Ctx extends RenderingTestContext {
  data: History[];
}

// Neither the polar wind-direction chart (a `scatter` series with a
// connecting line) nor the wind/air stock charts (`spline`/`area` series)
// sort or otherwise validate the order of the points they are given --
// Highcharts renders history data in exactly the array order it receives,
// even when that order isn't chronological. These tests pin that fact down
// with a deliberately out-of-order fixture (see issue #111: "Glitches with
// wind direction history"), so the guarantee that upstream data arrives
// pre-sorted -- currently enforced in app/handlers/history.ts -- doesn't
// silently regress. If either assertion below ever starts failing because
// Highcharts *did* start reordering points, that's a reason to revisit
// whether the handler-side sort is still needed, not a reason to just
// update the assertion.
module('Integration | Chart | point order', function (hooks) {
  setupRenderingTest(hooks);

  const now = Date.now();
  const outOfOrderHistory: History[] = [
    {
      id: 'a',
      direction: 10,
      speed: 5,
      gusts: 6,
      temperature: 6,
      humidity: 60,
      rain: 0,
      timestamp: now - 10 * 60 * 1000,
      [Type]: 'history',
    },
    {
      id: 'b',
      direction: 90,
      speed: 15,
      gusts: 16,
      temperature: 6,
      humidity: 60,
      rain: 0,
      timestamp: now - 5 * 60 * 1000,
      [Type]: 'history',
    },
    {
      // Deliberately earlier than both points above -- if this were fed to
      // the polar chart's scatter series unsorted, the connecting line
      // would visibly jump backwards in time (issue #111).
      id: 'c-out-of-order',
      direction: 270,
      speed: 25,
      gusts: 26,
      temperature: 6,
      humidity: 60,
      rain: 0,
      timestamp: now - 45 * 60 * 1000,
      [Type]: 'history',
    },
  ];

  test('the polar wind-direction chart renders points in the given array order, not sorted by time', async function (this: Ctx, assert) {
    this.data = outOfOrderHistory;

    await render(hbs`
      <div class="h-64 w-64">
        <Station::WindDirection::Graph @data={{this.data}} />
      </div>
    `);

    const Highcharts = (await import('highcharts')).default;
    // QUnit renders every test's charts into the same page, so `charts`
    // accumulates entries across the whole run -- take the most recent
    // polar chart, which is this test's.
    const chart = Highcharts.charts.findLast(
      (c) => c && c.options.chart?.polar
    );
    const series = chart?.series[0];
    const renderedTimestamps = series?.data.map((p) => p.y);

    assert.deepEqual(
      renderedTimestamps,
      outOfOrderHistory.map((row) => row.timestamp),
      'the chart mirrors the input array order verbatim, including the out-of-order entry'
    );
  });

  test('the wind stock chart renders points in the given array order, not sorted by time', async function (this: Ctx, assert) {
    this.data = outOfOrderHistory;

    await render(hbs`
      <div class="h-64 w-64">
        <Station::Wind::Presenter @history={{this.data}} />
      </div>
    `);

    const Highcharts = (await import('highcharts')).default;
    const chart = Highcharts.charts.findLast(
      (c) =>
        !c?.options.chart?.polar && c?.series.some((s) => s.name === 'Wind')
    );
    const series = chart?.series.find((s) => s.name === 'Wind');
    const renderedTimestamps = series?.data.map((p) => p.x);

    assert.deepEqual(
      renderedTimestamps,
      outOfOrderHistory.map((row) => row.timestamp),
      'the chart mirrors the input array order verbatim, including the out-of-order entry'
    );
  });
});
