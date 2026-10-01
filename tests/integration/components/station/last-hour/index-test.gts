import { module, test } from 'qunit';
import {
  findAll,
  render,
  settled,
  type RenderingTestContext,
  waitUntil,
} from '@ember/test-helpers';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import {
  rawHistory,
  setupStubbedApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import type { History } from 'winds-mobi-client-web/services/store';
import StationLastHour from 'winds-mobi-client-web/components/station/last-hour';
import { trackedObject } from '@ember/reactive/collections';

interface StationLastHourIndexTestContext extends RenderingTestContext {
  stationId: string;
}

// The min/mean/max metric cards render our own derived values (not
// Highcharts), so they're a stable signal for "which station's data is
// currently showing" without depending on chart rendering internals.
function renderedMetricValues() {
  return findAll('dd').map((dd) => dd.textContent?.trim());
}

module('Integration | Component | station/last-hour', function (hooks) {
  setupRenderingTest(hooks);
  const api = setupStubbedApi(hooks);

  test('it keeps the first station graph stable when another station resolves late', async function (this: StationLastHourIndexTestContext, assert) {
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

    // Station B's history is held until the test releases it, so it lands
    // only after the panel has already gone back to station A.
    let releaseStationB!: () => void;
    const stationBReleased = new Promise<void>((resolve) => {
      releaseStationB = resolve;
    });

    api.respond = async (url) => {
      if (url.pathname.includes('/station-b/')) {
        await stationBReleased;

        return rawHistory(stationBHistory);
      }

      return rawHistory(stationAHistory);
    };

    const state = trackedObject({ stationId: 'station-a' });

    await render(
      <template><StationLastHour @stationId={{state.stationId}} /></template>
    );

    const stationAInitialMetrics = renderedMetricValues();

    assert.true(stationAInitialMetrics.length > 0);

    // `settled()` would wait on station B's held request, so these steps
    // wait for exactly what they need instead.
    state.stationId = 'station-b';
    await waitUntil(() => api.calls.some((url) => url.includes('/station-b/')));

    state.stationId = 'station-a';
    await waitUntil(
      () =>
        JSON.stringify(renderedMetricValues()) ===
        JSON.stringify(stationAInitialMetrics)
    );

    releaseStationB();
    await settled();

    assert.deepEqual(renderedMetricValues(), stationAInitialMetrics);
  });
});
