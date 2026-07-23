import { module, test } from 'qunit';
import {
  render,
  settled,
  type RenderingTestContext,
} from '@ember/test-helpers';
import { set } from '@ember/object';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { History } from 'winds-mobi-client-web/services/store';
import type { ChartWithRangeSelector } from 'winds-mobi-client-web/modifiers/render-highcharts';

interface Ctx extends RenderingTestContext {
  history: History[];
  stationId: string;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();

// Five days of hourly readings ending at `endTime`, matching the wind/air
// charts' actual 5-day request duration -- long enough that "6h" (the
// default range) and "all data" produce clearly distinguishable axis spans.
function fiveDaysOfHistory(idPrefix: string, endTime: number): History[] {
  const history: History[] = [];
  for (let t = endTime - 5 * DAY; t <= endTime; t += HOUR) {
    history.push({
      id: `${idPrefix}:${t}`,
      direction: 180,
      speed: 10,
      gusts: 12,
      temperature: 10,
      humidity: 50,
      rain: 0,
      timestamp: t,
      [Type]: 'history',
    });
  }
  return history;
}

// Issue #137: this app used to render its stock charts through
// `ember-highcharts`, whose own update path called
// `chart.xAxis[0].setExtremes()` with no arguments after every
// content/options update, resetting any explicit range back to the full
// data span ("All") rather than the configured `rangeSelector.selected`
// default. On a station switch that reuses the same chart instance (no
// `:loading` gap in between, see CLAUDE.md's Highcharts section and issue
// #111), this silently left the chart zoomed out to everything instead of
// resetting to the intended default range. `render-highcharts.ts` now
// drives the chart directly and never does that blanket reset -- it only
// re-applies the default range (via `RangeSelector#clickButton`) when
// `stationId` itself changes. This test renders the real
// `Station::Wind::Presenter` and keeps the same instance mounted across a
// station switch (mirroring point-order-test.ts's own approach for the same
// underlying reuse scenario) to confirm that behavior.
module('Integration | Chart | range selector reset', function (hooks) {
  setupRenderingTest(hooks);

  test('switching stations resets the range selector to its default instead of leaving it at "All"', async function (this: Ctx, assert) {
    set(this, 'history', fiveDaysOfHistory('holfuy-1829', now));
    set(this, 'stationId', 'holfuy-1829');

    await render(hbs`
      <div class="h-64 w-64">
        <Station::Wind::Presenter @history={{this.history}} @stationId={{this.stationId}} />
      </div>
    `);

    const Highcharts = (await import('highcharts')).default;
    const findChart = () =>
      Highcharts.charts.findLast(
        (c) => c && c.series.some((s) => s.name === 'Wind')
      ) as ChartWithRangeSelector | undefined;

    const chartBefore = findChart();
    assert.strictEqual(
      chartBefore?.rangeSelector?.selected,
      4,
      'the initial render defaults to the "6h" range selector button'
    );

    set(this, 'history', fiveDaysOfHistory('holfuy-1808', now + 1000));
    set(this, 'stationId', 'holfuy-1808');
    await settled();

    const chartAfter = findChart();
    assert.strictEqual(
      chartAfter,
      chartBefore,
      'the same chart instance is reused across the station switch (matches the real cache-hit scenario)'
    );
    assert.strictEqual(
      chartAfter?.rangeSelector?.selected,
      4,
      'switching stations resets the range selector back to its "6h" default, not left at "All"'
    );

    const extremes = chartAfter?.xAxis[0]?.getExtremes();
    const spanHours = extremes
      ? (extremes.max - extremes.min) / HOUR
      : undefined;
    assert.ok(
      spanHours !== undefined && spanHours <= 7,
      `the visible axis span (${spanHours} hours) reflects the 6h default, not the full 5-day history`
    );
  });
});
