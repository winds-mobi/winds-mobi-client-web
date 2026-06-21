import { module, test } from 'qunit';
import { findAll, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { History } from 'winds-mobi-client-web/services/store';

type AirPresenterTestContext = {
  history: History[];
};

module('Integration | Component | station/air/presenter', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders both the temperature and humidity series on their own y-axes', async function (this: AirPresenterTestContext, assert) {
    const now = Date.now();

    this.history = [
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

    await render(hbs`<Station::Air::Presenter @history={{this.history}} />`);

    assert.dom('.highcharts-container').exists();
    assert.strictEqual(
      findAll('.highcharts-series').length,
      2,
      'both the temperature and humidity series render'
    );
    assert.strictEqual(
      findAll('.highcharts-yaxis-labels').length,
      2,
      'temperature and humidity each get their own y-axis'
    );
    assert
      .dom('.highcharts-graph')
      .exists('the temperature series renders as a line');
  });

  test('it renders the chart when there is no history', async function (this: AirPresenterTestContext, assert) {
    this.history = [];

    await render(hbs`<Station::Air::Presenter @history={{this.history}} />`);

    assert.dom('.highcharts-container').exists();
  });
});
