import { module, test } from 'qunit';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { History } from 'winds-mobi-client-web/services/store';

type WindDirectionGraphTestContext = {
  data: History[];
};

module(
  'Integration | Component | station/wind-direction/graph',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it skips rendering the chart when there is no history', async function (this: WindDirectionGraphTestContext, assert) {
      this.data = [];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);
      await settled();

      assert.dom('.highcharts-container').doesNotExist();
    });

    test('it renders the chart for older history using the latest sample as the reference point', async function (this: WindDirectionGraphTestContext, assert) {
      this.data = [
        {
          id: 'old-1',
          direction: 180,
          speed: 10,
          gusts: 14,
          temperature: 6,
          humidity: 60,
          timestamp: 1_710_000_000_000,
          [Type]: 'history',
        },
        {
          id: 'old-2',
          direction: 225,
          speed: 16,
          gusts: 22,
          temperature: 7,
          humidity: 58,
          timestamp: 1_710_003_600_000,
          [Type]: 'history',
        },
      ];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);
      await settled();

      assert.dom('.highcharts-container').exists();
    });
  }
);
