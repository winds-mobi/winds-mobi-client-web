import { module, test } from 'qunit';
import { render, type RenderingTestContext } from '@ember/test-helpers';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import {
  apiError,
  rawHistory,
  setupStubbedApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import type { History } from 'winds-mobi-client-web/services/store';
import StationWindDirectionThumbnail from 'winds-mobi-client-web/components/station/wind-direction-thumbnail';

interface StationWindDirectionThumbnailTestContext extends RenderingTestContext {
  stationId: string;
}

// Marker colours/positions are Highcharts' rendering, not ours (see
// tests/unit/utils/wind-direction-marker-test.ts and graph-test.ts). These
// tests only check that each <Request> branch (content/loading/error) mounts
// the graph without error.
module(
  'Integration | Component | station/wind-direction-thumbnail',
  function (hooks) {
    setupRenderingTest(hooks);
    const api = setupStubbedApi(hooks);

    test('it renders the graph with the resolved history', async function (this: StationWindDirectionThumbnailTestContext, assert) {
      const history: History[] = [
        {
          id: 'history-1',
          direction: 180,
          speed: 10,
          gusts: 14,
          temperature: 6,
          humidity: 60,
          rain: 0,
          timestamp: Date.now() - 30 * 60 * 1000,
          [Type]: 'history',
        },
      ];

      api.respond = () => rawHistory(history);

      const stationId: StationWindDirectionThumbnailTestContext['stationId'] =
        'holfuy-1804';

      await render(
        <template>
          <StationWindDirectionThumbnail @stationId={{stationId}} />
        </template>
      );

      assert.dom('.highcharts-container').exists();
    });

    test('it renders an empty graph when the request errors', async function (this: StationWindDirectionThumbnailTestContext, assert) {
      api.respond = () => apiError();
      const stationId: StationWindDirectionThumbnailTestContext['stationId'] =
        'holfuy-1804';

      await render(
        <template>
          <StationWindDirectionThumbnail @stationId={{stationId}} />
        </template>
      );

      assert.dom('.highcharts-container').exists();
    });
  }
);
