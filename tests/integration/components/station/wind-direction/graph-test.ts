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

    // Highcharts 13 auto-follows the OS/browser's prefers-color-scheme by
    // default (`palette.colorScheme` defaults to `'light dark'`), which would
    // otherwise silently switch this chart to a dark palette on a device set
    // to dark mode. `chart/polar.gts`'s `defaultChartOptions` pins
    // `palette.colorScheme` to `'light'`, which Highcharts reflects as an
    // inline `color-scheme: light` style on its own wrapper
    // (`.highcharts-container`) -- reading that confirms our option actually
    // reached and took effect on the real chart, not just that we passed it.
    test('it pins the chart to light mode regardless of the OS/browser color scheme preference', async function (this: WindDirectionGraphTestContext, assert) {
      this.data = [
        {
          id: 'reading',
          direction: 180,
          speed: 10,
          gusts: 14,
          temperature: 6,
          humidity: 60,
          rain: 0,
          timestamp: Date.now(),
          [Type]: 'history',
        },
      ];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      assert
        .dom('.highcharts-container')
        .hasAttribute('style', /color-scheme:\s*light/);
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

    // issue #120: the hour-wide window is anchored on the newest reading in
    // the data, never on wall-clock `Date.now()`. Anchoring off `Date.now()`
    // let the window drift away from a station that had gone quiet -- here,
    // one that last reported almost three hours ago -- pushing every reading
    // it did return outside the window and leaving the graph empty.
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

      const chart = await renderedPolarChart();

      assert.deepEqual(
        chart?.series[0]?.data.map((p) => p.y),
        this.data.map((row) => row.timestamp),
        'both stale readings still render, none clipped by a real-time window'
      );
      assert.strictEqual(
        chart?.yAxis[0]?.max,
        lastReadingTimestamp,
        "the outer edge is the stale station's last reading, not the current time"
      );
      assert.strictEqual(
        chart?.yAxis[0]?.min,
        lastReadingTimestamp - LAST_HOUR,
        'the center is an hour before that reading, not an hour before now'
      );
    });

    test('it spans exactly one hour ending at the newest reading, even when the data covers less', async function (this: WindDirectionGraphTestContext, assert) {
      const now = Date.now();

      // Only 12 minutes apart -- far short of a full hour. The window is
      // still a full hour wide, so these two readings occupy just the outer
      // fifth of the radius and the missing 48 minutes read as an empty
      // center, rather than the axis shrinking to the data's own span and
      // making radial distance mean something different per station.
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
        this.data[1]!.timestamp - LAST_HOUR,
        'the center is exactly one hour before the newest reading, not the oldest reading in the data'
      );
      assert.strictEqual(
        chart?.yAxis[0]?.max,
        this.data[1]!.timestamp,
        'the outer edge is the newest reading in the data'
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

    // The tooltip mirrors the wind history chart's: a time header, then one
    // line per value with a wind-band-coloured bullet, the label, and the
    // value in bold. Reading the string back off the rendered point checks
    // what this component actually handed Highcharts -- how Highcharts then
    // paints that markup is its own business, not ours to assert.
    test('it builds a tooltip listing the gust and the average wind, each with a coloured bullet and a bold speed', async function (this: WindDirectionGraphTestContext, assert) {
      this.data = [
        {
          id: 'reading',
          direction: 180,
          // Two different wind bands, so each bullet has to pick up its own
          // value's colour rather than sharing one.
          speed: 12,
          gusts: 24,
          temperature: 6,
          humidity: 60,
          rain: 0,
          timestamp: Date.now(),
          [Type]: 'history',
        },
      ];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      const series = (await renderedPolarChart())?.series[0];
      const tooltip =
        (
          series?.data[0]?.options as unknown as
            | { customTooltip?: string }
            | undefined
        )?.customTooltip ?? '';

      // Whitespace between the number and its unit is whatever `Intl` emits
      // for the locale (a plain space or a non-breaking one), so match either
      // rather than pinning the exact formatted string.
      assert.true(
        /<span style="color:var\(--color-wind-25\)">●<\/span> Gusts: <b>24\s?km\/h<\/b>/.test(
          tooltip
        ),
        'the gust row leads with a bullet in the gust’s own wind-band colour and shows the speed in bold'
      );
      assert.true(
        /<span style="color:var\(--color-wind-15\)">●<\/span> Wind: <b>12\s?km\/h<\/b>/.test(
          tooltip
        ),
        'the average-wind row leads with a bullet in its own wind-band colour and shows the speed in bold'
      );
      assert.true(
        tooltip.indexOf('Gusts:') < tooltip.indexOf('Wind:'),
        'the gust is listed first, matching the panel’s own cards'
      );
      assert.true(
        /^<span style="font-size: 0\.8em">\d{1,2}:\d{2}<\/span><br\/>/.test(
          tooltip
        ),
        'the reading’s time heads the tooltip, in a smaller type size'
      );
    });
  }
);
