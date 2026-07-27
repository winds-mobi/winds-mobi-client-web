import { module, test } from 'qunit';
import { render, type RenderingTestContext } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import type { Point } from 'highcharts';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import azimuthToCardinal from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';
import { KM_H_PER_M_S } from 'winds-mobi-client-web/utils/highcharts-options';
import type { History } from 'winds-mobi-client-web/services/store';

interface WindPresenterTestContext extends RenderingTestContext {
  history: History[];
}

// Wind direction is a beta feature, off by default (app/services/
// settings.ts) -- tests that exercise the Direction series must opt in
// explicitly, the same way tests for any other beta feature do (see e.g.
// tests/integration/components/navbar/refresh-control-test.ts).
function enableWindDirectionBeta(context: RenderingTestContext) {
  const settings = context.owner.lookup('service:settings');
  settings.betaFeaturesEnabled = true;
  settings.windDirectionHistoryEnabled = true;
}

// Highcharts' base `Point` type doesn't declare `direction`/`value` -- both
// are specific to the `windbarb` series type, not exposed in the base
// package's types.
interface WindbarbPointLike extends Point {
  direction: number;
  value: number;
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
  test('it does not include a Direction series while the beta feature is off (the default)', async function (this: WindPresenterTestContext, assert) {
    this.history = [
      {
        id: 'history-1',
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

    await render(
      hbs`<Station::Wind::Presenter @history={{this.history}} @stationId="holfuy-1829" />`
    );

    const Highcharts = (await import('highcharts')).default;
    const chart = Highcharts.charts.findLast((c) =>
      c?.series.some((s) => s.name === 'Wind')
    );

    assert.false(
      chart?.series.some((s) => s.name === 'Direction'),
      'no Direction series, and no windbarb module was loaded, for a default (non-beta) render'
    );
  });

  test('it feeds a windbarb point per reading to a Direction series', async function (this: WindPresenterTestContext, assert) {
    enableWindDirectionBeta(this);

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

  // Regression test for a real bug: at a zoomed-out range, Highcharts Stock
  // groups multiple raw readings into one visual point, recomputing the
  // grouped point's own `value`/`direction` via windbarb's built-in
  // vector-average approximation -- but earlier versions of this component
  // coloured and labelled each point from a precomputed field baked in
  // *before* grouping, so a grouped barb's rotation showed the correct
  // average while its colour and tooltip kept showing one raw reading from
  // that group, chosen arbitrarily. Densely-packed, alternating readings
  // here force grouping even in the chart's default (narrowest) range, so
  // this doesn't depend on interacting with the range selector.
  test('a grouped Direction point colours and labels itself from its own (grouped) value, not a stale raw reading', async function (this: WindPresenterTestContext, assert) {
    enableWindDirectionBeta(this);

    const now = Date.now();

    this.history = Array.from({ length: 400 }, (_, i) => ({
      id: `history-${i}`,
      // Alternating between two clearly different readings: any group
      // spanning more than one raw point averages to a value/direction
      // that doesn't equal either raw reading, so a stale field would be
      // visibly wrong, not coincidentally right.
      direction: i % 2 === 0 ? 10 : 90,
      speed: i % 2 === 0 ? 3 : 45,
      gusts: 22,
      temperature: 6,
      humidity: 60,
      rain: 0,
      // Oldest first, matching the chronological order app/handlers/
      // history.ts always delivers -- Highcharts Stock's data grouping
      // isn't well-defined over unsorted data (see point-order-test.ts).
      timestamp: now - (400 - i) * 30 * 1000,
      [Type]: 'history',
    }));

    await render(
      hbs`<div class="h-64 w-64"><Station::Wind::Presenter @history={{this.history}} @stationId="holfuy-1829" /></div>`
    );

    const Highcharts = (await import('highcharts')).default;
    const chart = Highcharts.charts.findLast((c) =>
      c?.series.some((s) => s.name === 'Direction')
    );
    const series = chart?.series.find((s) => s.name === 'Direction');
    const points = (series?.points ??
      series?.data ??
      []) as WindbarbPointLike[];
    const grouped = points.find(
      (p) =>
        ((p as unknown as { dataGroup?: { length: number } }).dataGroup
          ?.length ?? 1) > 1
    );

    assert.ok(
      grouped,
      'fixture is dense enough that at least one rendered point groups multiple raw readings'
    );
    assert.strictEqual(
      grouped?.color,
      windToColour(grouped!.value * KM_H_PER_M_S),
      "the point's colour matches its own (grouped) value"
    );

    const tooltip = (
      series as unknown as {
        tooltipOptions: { pointFormatter: (this: unknown) => string };
      }
    ).tooltipOptions.pointFormatter.call(grouped);
    // Non-null: the index into DIRECTIONS is always 0-7 for any real
    // degrees value, TS just can't see that from the modulo alone.
    const expectedDirectionText = azimuthToCardinal(
      Math.round(grouped!.direction)
    )!;

    assert.true(
      tooltip.includes(expectedDirectionText),
      `tooltip "${tooltip}" mentions the point's own (grouped) direction (${expectedDirectionText}), not a stale raw reading`
    );
  });

  // Regression test for a real bug: windbarb's vector-average approximation
  // (see ApproximationRegistry.windbarb in Highcharts' own WindbarbSeries.js)
  // recovers the group's direction via `Math.atan2`, which returns degrees
  // in (-180, 180], not [0, 360) -- a raw reading is always already 0-359,
  // so this only surfaces for a grouped point whose average direction falls
  // in the "negative" half (e.g. 200° comes back as -160°, the same angle).
  // Feeding that negative value straight into azimuthToCardinal broke: its
  // own `% 8` keeps JS's sign-of-the-dividend behaviour on a negative input,
  // indexing DIRECTIONS out of bounds and rendering the literal string
  // "undefined" in the tooltip instead of a cardinal direction.
  test('a grouped Direction point whose vector average wraps negative still renders a real cardinal, not "undefined"', async function (this: WindPresenterTestContext, assert) {
    enableWindDirectionBeta(this);

    const now = Date.now();

    this.history = Array.from({ length: 400 }, (_, i) => ({
      id: `history-${i}`,
      // Constant direction, alternating speed only: forces grouping (same
      // as the test above) while keeping the vector average exactly 200°
      // (recovered by atan2 as -160°) rather than some other blend.
      direction: 200,
      speed: i % 2 === 0 ? 3 : 45,
      gusts: 22,
      temperature: 6,
      humidity: 60,
      rain: 0,
      timestamp: now - (400 - i) * 30 * 1000,
      [Type]: 'history',
    }));

    await render(
      hbs`<div class="h-64 w-64"><Station::Wind::Presenter @history={{this.history}} @stationId="holfuy-1829" /></div>`
    );

    const Highcharts = (await import('highcharts')).default;
    const chart = Highcharts.charts.findLast((c) =>
      c?.series.some((s) => s.name === 'Direction')
    );
    const series = chart?.series.find((s) => s.name === 'Direction');
    const points = (series?.points ??
      series?.data ??
      []) as WindbarbPointLike[];
    const grouped = points.find(
      (p) =>
        ((p as unknown as { dataGroup?: { length: number } }).dataGroup
          ?.length ?? 1) > 1
    );

    assert.ok(
      grouped,
      'fixture is dense enough that at least one rendered point groups multiple raw readings'
    );
    assert.true(
      grouped!.direction < 0,
      `fixture reproduces the wraparound: grouped direction (${grouped?.direction}) is negative, as atan2 returns for a 200° average`
    );

    const tooltip = (
      series as unknown as {
        tooltipOptions: { pointFormatter: (this: unknown) => string };
      }
    ).tooltipOptions.pointFormatter.call(grouped);

    assert.false(
      tooltip.includes('undefined'),
      `tooltip "${tooltip}" must not contain "undefined"`
    );
    assert.true(
      tooltip.includes('S') && tooltip.includes('200°'),
      `tooltip "${tooltip}" shows the normalized cardinal/degrees (S, 200°), not the raw negative value`
    );
  });
});
