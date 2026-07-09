import Service from '@ember/service';
import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { History } from 'winds-mobi-client-web/services/store';

type StationWindDirectionThumbnailTestContext = {
  stationId: string;
};

class FakeMapRefreshService extends Service {
  lastRefresh = 0;
}

class FakeStoreService extends Service {
  response: Promise<{ content: { data: History[] } }> = Promise.resolve({
    content: { data: [] },
  });

  request() {
    return this.response;
  }
}

module(
  'Integration | Component | station/wind-direction-thumbnail',
  function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
      this.owner.register('service:store', FakeStoreService);
      this.owner.register('service:map-refresh', FakeMapRefreshService);
    });

    test('it renders the graph with the resolved history', async function (this: StationWindDirectionThumbnailTestContext, assert) {
      const store = this.owner.lookup('service:store') as FakeStoreService;

      store.response = Promise.resolve({
        content: {
          data: [
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
          ],
        },
      });

      this.stationId = 'holfuy-1804';

      await render(
        hbs`<Station::WindDirectionThumbnail @stationId={{this.stationId}} />`
      );

      assert.dom('.highcharts-container').exists();
      assert.dom('.highcharts-point').exists();
    });

    test('it renders an empty graph when the request errors', async function (this: StationWindDirectionThumbnailTestContext, assert) {
      const store = this.owner.lookup('service:store') as FakeStoreService;

      const rejection = Promise.reject(new Error('boom'));
      rejection.catch(() => {
        // Prevent an unhandled-rejection warning; the assertion below cares
        // only about how the component renders the error state.
      });
      store.response = rejection;
      this.stationId = 'holfuy-1804';

      await render(
        hbs`<Station::WindDirectionThumbnail @stationId={{this.stationId}} />`
      );

      assert.dom('.highcharts-container').exists();
      assert.dom('.highcharts-point').doesNotExist();
    });
  }
);
