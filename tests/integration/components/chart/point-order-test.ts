import Service from '@ember/service';
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
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import type { History } from 'winds-mobi-client-web/services/store';

interface Ctx extends RenderingTestContext {
  data: History[];
  stationId: string;
}

type FakeStoreRequest = { url?: string };

class FakeMapRefreshService extends Service {
  lastRefresh = 0;
}

// Mirrors tests/integration/components/station/last-hour/index-test.ts's
// FakeStoreService, keyed by request URL so each station resolves its own
// fixed fixture.
class FakeStoreService extends Service {
  responses = new Map<string, History[]>();

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    return Promise.resolve({
      content: { data: this.responses.get(url) ?? [] },
    });
  }
}

function lastHourRequestUrl(stationId: string) {
  return historyQuery<History>(
    'history',
    stationId,
    { duration: 60 * 60, keys: ['w-dir', 'w-avg', 'w-max'] },
    { backgroundReload: true }
  ).url;
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
    set(this, 'data', outOfOrderHistory);

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
    set(this, 'data', outOfOrderHistory);

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

  // Investigated as part of issue #111: since ember-highcharts updates an
  // existing chart in place via Highcharts' `series.setData()` rather than
  // always destroying/recreating it, and Highcharts falls back to matching
  // incoming points by raw x value (wind direction here) when it can't match
  // by id, switching stations on a *reused* chart instance could in theory
  // leave a stale point behind or interleave points in the wrong order.
  // Verified empirically (by comparing `chart.index` before/after the
  // switch) that this doesn't actually happen: StationHistorySection's
  // `<Request @request={{this.historyRequest}}>` gets a genuinely new
  // Future for a new station, and that causes the whole
  // Request/WindDirectionGraph/HighCharts subtree -- and therefore the
  // Highcharts chart instance itself -- to be destroyed and recreated, not
  // incrementally updated. So there's never a stale chart around to
  // misupdate in the first place. This test pins that down as a regression
  // guard on the mechanism, not because a fix was needed here.
  test('switching stations replaces the chart instance instead of incrementally updating a shared one', async function (this: Ctx, assert) {
    this.owner.register('service:store', FakeStoreService);
    this.owner.register('service:map-refresh', FakeMapRefreshService);

    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;

    // Station A's second point deliberately shares a wind direction (180)
    // with station B's second point, and station B's first point is
    // deliberately unrelated -- exactly the shape that would expose
    // Highcharts' by-x-value point matching if the chart were reused.
    const stationA: History[] = [
      {
        id: 'holfuy-1829:1',
        direction: 45,
        speed: 5,
        gusts: 6,
        temperature: 6,
        humidity: 60,
        rain: 0,
        timestamp: now - 20 * 60 * 1000,
        [Type]: 'history',
      },
      {
        id: 'holfuy-1829:2',
        direction: 180,
        speed: 6,
        gusts: 7,
        temperature: 6,
        humidity: 60,
        rain: 0,
        timestamp: now - 10 * 60 * 1000,
        [Type]: 'history',
      },
    ];
    const stationB: History[] = [
      {
        id: 'holfuy-1808:1',
        direction: 270,
        speed: 20,
        gusts: 21,
        temperature: 6,
        humidity: 60,
        rain: 0,
        timestamp: now - 4 * 60 * 1000,
        [Type]: 'history',
      },
      {
        id: 'holfuy-1808:2',
        direction: 180,
        speed: 25,
        gusts: 26,
        temperature: 6,
        humidity: 60,
        rain: 0,
        timestamp: now - 3 * 60 * 1000,
        [Type]: 'history',
      },
    ];

    store.responses.set(lastHourRequestUrl('holfuy-1829'), stationA);
    store.responses.set(lastHourRequestUrl('holfuy-1808'), stationB);

    set(this, 'stationId', 'holfuy-1829');
    await render(hbs`<Station::LastHour @stationId={{this.stationId}} />`);

    const Highcharts = (await import('highcharts')).default;
    const chartBefore = Highcharts.charts.findLast(
      (c) => c && c.options.chart?.polar
    );

    set(this, 'stationId', 'holfuy-1808');
    await settled();

    const chartAfter = Highcharts.charts.findLast(
      (c) => c && c.options.chart?.polar
    );

    assert.notStrictEqual(
      chartAfter,
      chartBefore,
      'the chart instance itself was replaced, not reused, across the station switch'
    );

    const points =
      chartAfter?.series[0]?.data.map((p) => ({ x: p.x, y: p.y })) ?? [];

    assert.deepEqual(
      points,
      stationB.map((row) => ({ x: row.direction, y: row.timestamp })),
      "after switching to station B, the chart shows only station B's points, in station B's own order"
    );
  });
});
