import { module, test } from 'qunit';
import { render, type RenderingTestContext } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { History } from 'winds-mobi-client-web/services/store';

interface WindDirectionGraphTestContext extends RenderingTestContext {
  data: History[];
}

// This component's own logic is the marker-colour mapping, covered directly
// by tests/unit/utils/wind-direction-marker-test.ts. Actually drawing the
// chart is Highcharts' responsibility, not ours, so these tests only check
// that the component accepts `@data` and renders without error -- not that
// the underlying chart library paints correctly.
module(
  'Integration | Component | station/wind-direction/graph',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders the chart when there is no history', async function (this: WindDirectionGraphTestContext, assert) {
      this.data = [];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      assert.dom('.highcharts-container').exists();
    });

    test('it renders the chart for recent history', async function (this: WindDirectionGraphTestContext, assert) {
      this.data = [
        {
          id: 'old-1',
          direction: 180,
          speed: 10,
          gusts: 14,
          temperature: 6,
          humidity: 60,
          rain: 0,
          timestamp: Date.now() - 30 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'old-2',
          direction: 225,
          speed: 16,
          gusts: 22,
          temperature: 7,
          humidity: 58,
          rain: 0,
          timestamp: Date.now() - 5 * 60 * 1000,
          [Type]: 'history',
        },
      ];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      assert.dom('.highcharts-container').exists();
    });
  }
);
