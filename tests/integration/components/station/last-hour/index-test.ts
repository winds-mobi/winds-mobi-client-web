import Service from '@ember/service';
import { module, test } from 'qunit';
import {
  findAll,
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

type DeferredHistoryRequest = {
  promise: Promise<{ content: { data: History[] } }>;
  resolve: (value: { content: { data: History[] } }) => void;
};

type FakeStoreRequest = {
  url?: string;
};

interface StationLastHourIndexTestContext extends RenderingTestContext {
  stationId: string;
}

class FakeMapRefreshService extends Service {
  lastRefresh = 0;
}

class FakeStoreService extends Service {
  responses = new Map<string, Promise<{ content: { data: History[] } }>>();

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    return (
      this.responses.get(url) ??
      Promise.resolve({
        content: {
          data: [],
        },
      })
    );
  }
}

function createDeferredHistoryRequest(): DeferredHistoryRequest {
  let resolve!: (value: { content: { data: History[] } }) => void;

  const promise = new Promise<{ content: { data: History[] } }>(
    (resolvePromise) => {
      resolve = resolvePromise;
    }
  );

  return { promise, resolve };
}

function lastHourRequestUrl(stationId: string) {
  return historyQuery<History>(
    'history',
    stationId,
    {
      duration: 60 * 60,
      keys: ['w-dir', 'w-avg', 'w-max'],
    },
    {
      backgroundReload: true,
    }
  ).url;
}

// The min/mean/max metric cards render our own derived values (not
// Highcharts), so they're a stable signal for "which station's data is
// currently showing" without depending on chart rendering internals.
function renderedMetricValues() {
  return findAll('dd').map((dd) => dd.textContent?.trim());
}

module('Integration | Component | station/last-hour', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
    this.owner.register('service:map-refresh', FakeMapRefreshService);
  });

  test('it keeps the first station graph stable when another station resolves late', async function (this: StationLastHourIndexTestContext, assert) {
    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;
    const now = Date.now();

    const stationAHistory: History[] = [
      {
        id: 'station-a:1',
        direction: 300,
        speed: 10,
        gusts: 14,
        temperature: 6,
        humidity: 60,
        rain: 0,
        timestamp: now - 45 * 60 * 1000,
        [Type]: 'history',
      },
      {
        id: 'station-a:2',
        direction: 120,
        speed: 13,
        gusts: 18,
        temperature: 7,
        humidity: 58,
        rain: 0,
        timestamp: now - 30 * 60 * 1000,
        [Type]: 'history',
      },
      {
        id: 'station-a:3',
        direction: 240,
        speed: 16,
        gusts: 22,
        temperature: 8,
        humidity: 55,
        rain: 0,
        timestamp: now - 10 * 60 * 1000,
        [Type]: 'history',
      },
    ];

    const stationBHistory: History[] = [
      {
        id: 'station-b:1',
        direction: 225,
        speed: 5,
        gusts: 8,
        temperature: 3,
        humidity: 70,
        rain: 0,
        timestamp: now - 50 * 60 * 1000,
        [Type]: 'history',
      },
      {
        id: 'station-b:2',
        direction: 45,
        speed: 7,
        gusts: 11,
        temperature: 4,
        humidity: 68,
        rain: 0,
        timestamp: now - 25 * 60 * 1000,
        [Type]: 'history',
      },
      {
        id: 'station-b:3',
        direction: 315,
        speed: 9,
        gusts: 13,
        temperature: 5,
        humidity: 65,
        rain: 0,
        timestamp: now - 5 * 60 * 1000,
        [Type]: 'history',
      },
    ];

    const deferredStationBHistory = createDeferredHistoryRequest();

    store.responses.set(
      lastHourRequestUrl('station-a'),
      Promise.resolve({
        content: {
          data: stationAHistory,
        },
      })
    );
    store.responses.set(
      lastHourRequestUrl('station-b'),
      deferredStationBHistory.promise
    );

    set(this, 'stationId', 'station-a');

    await render(hbs`<Station::LastHour @stationId={{this.stationId}} />`);

    const stationAInitialMetrics = renderedMetricValues();

    assert.true(stationAInitialMetrics.length > 0);

    set(this, 'stationId', 'station-b');
    await settled();

    set(this, 'stationId', 'station-a');
    await settled();

    assert.deepEqual(renderedMetricValues(), stationAInitialMetrics);

    deferredStationBHistory.resolve({
      content: {
        data: stationBHistory,
      },
    });
    await settled();

    assert.deepEqual(renderedMetricValues(), stationAInitialMetrics);
  });
});
