import { module, test } from 'qunit';
import { render, type RenderingTestContext } from '@ember/test-helpers';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { History } from 'winds-mobi-client-web/services/store';
import StationAirPresenter from 'winds-mobi-client-web/components/station/air/presenter';

interface AirPresenterTestContext extends RenderingTestContext {
  history: History[];
}

// The temperature/humidity series data itself is built by seriesFor (unit
// tested in tests/unit/utils/chart-series-test.ts). Drawing it is
// Highcharts' responsibility, not ours, so these tests only check that the
// component accepts `@history` and renders without error.
module('Integration | Component | station/air/presenter', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the chart for recent history', async function (this: AirPresenterTestContext, assert) {
    const now = Date.now();

    const history: AirPresenterTestContext['history'] = [
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
        temperature: 22,
        humidity: 58,
        rain: 0,
        timestamp: now - 5 * 60 * 1000,
        [Type]: 'history',
      },
    ];

    await render(
      <template>
        <StationAirPresenter @history={{history}} @stationId="holfuy-1829" />
      </template>
    );

    assert.dom('.highcharts-container').exists();
  });

  test('it renders the chart when there is no history', async function (this: AirPresenterTestContext, assert) {
    const history: AirPresenterTestContext['history'] = [];

    await render(
      <template>
        <StationAirPresenter @history={{history}} @stationId="holfuy-1829" />
      </template>
    );

    assert.dom('.highcharts-container').exists();
  });
});
