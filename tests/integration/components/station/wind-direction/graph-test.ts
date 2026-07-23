import { module, test } from 'qunit';
import { render, type RenderingTestContext } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { History } from 'winds-mobi-client-web/services/store';

const LAST_HOUR = 1 * 60 * 60 * 1000;

interface WindDirectionGraphTestContext extends RenderingTestContext {
  data: History[];
}

async function renderedPolarChart() {
  const Highcharts = (await import('highcharts')).default;

  return Highcharts.charts.findLast((c) => c && c.options.chart?.polar);
}

// This component's own logic is the marker-colour mapping, covered directly
// by tests/unit/utils/wind-direction-marker-test.ts. Actually drawing the
// chart is Highcharts' responsibility, not ours, so these tests only check
// that the component accepts `@data` and renders without error -- not that
// the underlying chart library paints correctly.
module(
  'Integration | Component | station/wind-direction/graph',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders the chart when there is no history', async function (this: WindDirectionGraphTestContext, assert) {
      this.data = [];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      assert.dom('.highcharts-container').exists();
    });

    test('it renders the chart for recent history', async function (this: WindDirectionGraphTestContext, assert) {
      this.data = [
        {
          id: 'old-1',
          direction: 180,
          speed: 10,
          gusts: 14,
          temperature: 6,
          humidity: 60,
          rain: 0,
          timestamp: Date.now() - 30 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'old-2',
          direction: 225,
          speed: 16,
          gusts: 22,
          temperature: 7,
          humidity: 58,
          rain: 0,
          timestamp: Date.now() - 5 * 60 * 1000,
          [Type]: 'history',
        },
      ];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      assert.dom('.highcharts-container').exists();
    });

    // issue #120: the window is derived from the data's own oldest/newest
    // timestamps, not anchored to wall-clock `Date.now()` or to a fixed
    // 1-hour span off either end. Anchoring off `Date.now()` let the window
    // drift away from a station that had gone quiet; anchoring a fixed
    // 1-hour span off the newest reading instead assumed the returned data
    // always covers a full hour, which isn't guaranteed -- so a reading
    // could fall outside the assumed span. Deriving both axis ends from the
    // data itself rules that out by construction.
    test('it keeps stale readings on screen instead of anchoring the window to wall-clock time', async function (this: WindDirectionGraphTestContext, assert) {
      const lastReadingTimestamp = Date.now() - 170 * 60 * 1000;

      this.data = [
        {
          id: 'stale-1',
          direction: 45,
          speed: 8,
          gusts: 10,
          temperature: 5,
          humidity: 62,
          rain: 0,
          timestamp: lastReadingTimestamp - 15 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'stale-2',
          direction: 90,
          speed: 9,
          gusts: 12,
          temperature: 5,
          humidity: 61,
          rain: 0,
          timestamp: lastReadingTimestamp,
          [Type]: 'history',
        },
      ];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      const series = (await renderedPolarChart())?.series[0];

      assert.deepEqual(
        series?.data.map((p) => p.y),
        this.data.map((row) => row.timestamp),
        'both stale readings still render, none clipped by a real-time window'
      );
    });

    test('it sizes the axis to the data span it was actually given, not a fixed 1-hour offset', async function (this: WindDirectionGraphTestContext, assert) {
      const now = Date.now();

      // Only 12 minutes apart -- far short of a full hour. Under a fixed
      // `newest - 1 hour` window this data would still render fine (nothing
      // falls outside a *wider* assumed span), but the axis and the data
      // would disagree about what "the edge" means; deriving the axis from
      // the data itself keeps them in lockstep, which is what this test pins.
      this.data = [
        {
          id: 'oldest',
          direction: 200,
          speed: 4,
          gusts: 5,
          temperature: 6,
          humidity: 60,
          rain: 0,
          timestamp: now - 12 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'newest',
          direction: 20,
          speed: 6,
          gusts: 7,
          temperature: 6,
          humidity: 59,
          rain: 0,
          timestamp: now,
          [Type]: 'history',
        },
      ];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      const chart = await renderedPolarChart();

      assert.strictEqual(
        chart?.yAxis[0]?.min,
        this.data[0]!.timestamp,
        'axis min is the oldest reading in the data, not an hour before the newest'
      );
      assert.strictEqual(
        chart?.yAxis[0]?.max,
        this.data[1]!.timestamp,
        'axis max is the newest reading in the data'
      );
    });

    test('it places the most recently recorded reading closer to the outer edge than an older one', async function (this: WindDirectionGraphTestContext, assert) {
      const now = Date.now();

      this.data = [
        {
          id: 'older',
          direction: 270,
          speed: 5,
          gusts: 6,
          temperature: 6,
          humidity: 60,
          rain: 0,
          timestamp: now - 30 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'recent',
          direction: 90,
          speed: 15,
          gusts: 16,
          temperature: 7,
          humidity: 58,
          rain: 0,
          timestamp: now,
          [Type]: 'history',
        },
      ];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      const chart = await renderedPolarChart();
      const series = chart?.series[0];
      // `pane` (the polar center/radius) isn't part of Highcharts' public
      // `Chart` type -- it's added at runtime by the highcharts-more/polar
      // module -- so read it through a narrow local shape instead of `any`.
      const pane = (
        chart as unknown as { pane?: { center: number[] }[] } | undefined
      )?.pane?.[0]?.center;
      const [centerX, centerY] = [pane?.[0] ?? 0, pane?.[1] ?? 0];

      const distanceFromCenter = (point: { plotX?: number; plotY?: number }) =>
        Math.hypot((point.plotX ?? 0) - centerX, (point.plotY ?? 0) - centerY);

      const distances = series?.data.map(distanceFromCenter) ?? [];
      const [olderDistance, recentDistance] = [
        distances[0] ?? 0,
        distances[1] ?? 0,
      ];

      assert.true(
        recentDistance > olderDistance,
        'the more recent reading sits closer to the outer edge'
      );
    });

    test('it renders a single reading as a spoke from the center to the outer edge', async function (this: WindDirectionGraphTestContext, assert) {
      const timestamp = Date.now();

      this.data = [
        {
          id: 'only',
          direction: 135,
          speed: 5,
          gusts: 6,
          temperature: 6,
          humidity: 60,
          rain: 0,
          timestamp,
          [Type]: 'history',
        },
      ];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      const series = (await renderedPolarChart())?.series[0];

      assert.deepEqual(
        series?.data.map((p) => p.y),
        [timestamp, timestamp - LAST_HOUR],
        'a synthetic point is added at the center, in the same direction, so the single reading draws as a visible spoke rather than a lone dot on the outer ring'
      );
    });

    // A grid card (e.g. the nearby-list thumbnail) can render wider than
    // Polar's own maxWidth:90 responsive breakpoint depending on viewport/
    // column count while still being "the small one" by design intent, so
    // `@compact` must force cardinal-only labels itself rather than relying
    // on the chart's actual measured width to cross that threshold.
    test('it forces cardinal-only labels when @compact is set, regardless of measured width', async function (this: WindDirectionGraphTestContext, assert) {
      this.data = [];

      await render(hbs`
        <div class="h-96 w-96">
          <Station::WindDirection::Graph @data={{this.data}} @compact={{true}} />
        </div>
      `);

      const chart = await renderedPolarChart();
      // The label formatter isn't part of Highcharts' public `XAxisOptions`
      // type in a directly-callable shape, so read it through a narrow local
      // shape instead of `any`.
      const formatter = (
        chart?.userOptions.xAxis as
          | { labels?: { formatter?: (ctx: { value: number }) => string } }[]
          | undefined
      )?.[0]?.labels?.formatter;

      assert.strictEqual(formatter?.({ value: 0 }), 'N');
      assert.strictEqual(formatter?.({ value: 90 }), 'E');
      assert.strictEqual(formatter?.({ value: 45 }), '');
      assert.strictEqual(formatter?.({ value: 315 }), '');
    });
  }
);
