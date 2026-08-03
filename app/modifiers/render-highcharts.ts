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
      // Set by the wind history stock chart (the only chart with a
      // `windbarb` series -- the settings page's showcase preview reuses
      // that same component, rather than driving this modifier directly).
      // Left undefined/false for every other chart so they don't pay for a
      // module they never use.
      needsWindbarb?: boolean;
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
      needsWindbarb,
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
      defaultRangeSelectorIndex,
      needsWindbarb
    );
  }

  private async sync(
    callId: number,
    element: HTMLDivElement,
    kind: ChartKind,
    chartOptions: ChartOptions,
    seriesData: NamedSeriesOptions[] | undefined,
    stationId: string | undefined,
    defaultRangeSelectorIndex: number | undefined,
    needsWindbarb: boolean | undefined
  ) {
    // Wrapped in `waitForPromise` so test helpers' `await settled()` (and
    // `render()`, which awaits it internally) wait for this async chart
    // creation instead of asserting against a not-yet-drawn chart.
    const Highcharts = (await waitForPromise(import('highcharts'))).default;

    // Always loaded, not gated behind a "does this particular chart need
    // it" flag: the polar wind-direction chart (the only `chart`-kind
    // consumer, needing highcharts-more's pane/radial-axis support) renders
    // on every station panel, right alongside the stock charts -- there is
    // no real page view where highcharts-more's bytes would have been
    // avoided, only extra branching to express a distinction with no
    // payoff. See CLAUDE.md on not adding gymnastics for cases that don't
    // happen.
    await waitForPromise(import('highcharts/highcharts-more'));

    if (kind === 'stockChart') {
      await waitForPromise(import('highcharts/modules/stock'));
    }

    if (needsWindbarb) {
      // windbarb registers its own custom data-grouping approximation (a
      // vector-average weighted by speed) into Highcharts' shared
      // `dataGrouping.approximations` registry on load -- that registry only
      // exists once `modules/stock` has run, already loaded above since
      // `needsWindbarb` is only ever set on a `stockChart`.
      await waitForPromise(import('highcharts/modules/windbarb'));
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
