import Modifier, { type ArgsFor } from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';
import { waitForPromise } from '@ember/test-waiters';
import type Owner from '@ember/owner';
import type { Chart, Options } from 'highcharts';
import {
  updateChart,
  type NamedSeriesOptions,
} from 'winds-mobi-client-web/utils/highcharts-lifecycle';
import type { ChartOptions } from 'winds-mobi-client-web/utils/highcharts-options';

// Highcharts' own types don't declare the `rangeSelector` runtime property
// on `Chart` at all (it's a Stock feature, undocumented in the base
// package's types) -- this widens the real `Chart` type with the one method
// this modifier calls.
export interface ChartWithRangeSelector extends Chart {
  rangeSelector?: {
    clickButton(index: number, redraw?: boolean): void;
    selected?: number;
  };
}

type ChartKind = 'chart' | 'stockChart';

interface RenderHighchartsSignature {
  Element: HTMLDivElement;
  Args: {
    Positional: [
      kind: ChartKind,
      chartOptions: ChartOptions,
      seriesData: NamedSeriesOptions[] | undefined,
    ];
    Named: {
      // Stock charts only -- see the `stationId` handling below. Left
      // undefined for the plain/polar chart, which has no range selector.
      stationId?: string;
      defaultRangeSelectorIndex?: number;
    };
  };
}

// Drives Highcharts directly (no `ember-highcharts`): builds the chart once,
// then updates the *same* instance in place on every subsequent call rather
// than tearing it down and recreating it (matching the previous behavior,
// which several other comments in this app already depend on -- see e.g.
// CLAUDE.md's Highcharts section on issue #111). One modifier drives both
// chart "kinds" this app uses -- the plain/polar wind-direction chart and
// the wind/air stock charts -- since the only real differences between them
// (which Highcharts factory function to call, which extra module to import,
// and the stock-only range-selector reset below) are each a few lines; the
// actual chart lifecycle (create-or-update, destroy) is identical.
//
// Owning this update path ourselves (instead of going through
// `ember-highcharts`'s own `onDidUpdate`) also fixes issue #137 at the root,
// for the stock charts: that addon calls `chart.xAxis[0].setExtremes()`
// with no arguments on *every* update, unconditionally resetting the
// visible range back to "all data" instead of the configured
// `rangeSelector.selected` default. This modifier never does that -- it
// only re-applies the default range (via `RangeSelector#clickButton`, the
// same as a user clicking the button) when `stationId` actually changes,
// leaving any other update (e.g. a same-station background refresh) free
// to preserve whatever range is currently showing.
export default class RenderHighchartsModifier extends Modifier<RenderHighchartsSignature> {
  private chart: Chart | null = null;
  private previousStationId: string | null = null;
  // Dynamic imports of the same specifier resolve instantly once Highcharts
  // has loaded once, but the very first chart on a page can still have two
  // `modify()` calls race while that first import is in flight (e.g. a
  // station switch that happens before the initial mount has resolved).
  // This token lets a later call's result win over an earlier one that
  // resolves after it, rather than clobbering fresher args with stale ones.
  private latestCallId = 0;

  constructor(owner: Owner, args: ArgsFor<RenderHighchartsSignature>) {
    super(owner, args);
    registerDestructor(this, () => this.chart?.destroy());
  }

  modify(
    element: HTMLDivElement,
    [kind, chartOptions, seriesData]: [
      ChartKind,
      ChartOptions,
      NamedSeriesOptions[] | undefined,
    ],
    {
      stationId,
      defaultRangeSelectorIndex,
    }: RenderHighchartsSignature['Args']['Named']
  ) {
    const callId = ++this.latestCallId;

    void this.sync(
      callId,
      element,
      kind,
      chartOptions,
      seriesData,
      stationId,
      defaultRangeSelectorIndex
    );
  }

  private async sync(
    callId: number,
    element: HTMLDivElement,
    kind: ChartKind,
    chartOptions: ChartOptions,
    seriesData: NamedSeriesOptions[] | undefined,
    stationId: string | undefined,
    defaultRangeSelectorIndex: number | undefined
  ) {
    // Wrapped in `waitForPromise` so test helpers' `await settled()` (and
    // `render()`, which awaits it internally) wait for this async chart
    // creation instead of asserting against a not-yet-drawn chart.
    const Highcharts = (await waitForPromise(import('highcharts'))).default;

    if (kind === 'stockChart') {
      await waitForPromise(import('highcharts/modules/stock'));
    } else {
      // Polar support (the pane, radial axes, `chart.polar: true`) lives in
      // this module, not core Highcharts.
      await waitForPromise(import('highcharts/highcharts-more'));
    }

    if (callId !== this.latestCallId) {
      return;
    }

    if (!this.chart) {
      this.chart = Highcharts[kind](element, {
        ...chartOptions,
        series: seriesData,
      } as Options);
    } else {
      updateChart(this.chart, chartOptions, seriesData);
    }

    if (stationId !== undefined && stationId !== this.previousStationId) {
      (this.chart as ChartWithRangeSelector).rangeSelector?.clickButton(
        defaultRangeSelectorIndex ?? 0,
        true
      );
      this.previousStationId = stationId;
    }
  }
}
