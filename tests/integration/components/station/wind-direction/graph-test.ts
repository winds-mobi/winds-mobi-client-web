import { module, test } from 'qunit';
import { find, findAll, render, settled, waitUntil } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { History } from 'winds-mobi-client-web/services/store';

type WindDirectionGraphTestContext = {
  data: History[];
};

function renderedPointSignature() {
  return findAll('.highcharts-point')
    .map((point) => point.getAttribute('d'))
    .filter((value): value is string => Boolean(value));
}

function renderedGraphSignature() {
  return find('.highcharts-graph')?.getAttribute('d');
}

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
      const now = Date.now();

      this.data = [
        {
          id: 'old-1',
          direction: 180,
          speed: 10,
          gusts: 14,
          temperature: 6,
          humidity: 60,
          timestamp: now - 30 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'old-2',
          direction: 225,
          speed: 16,
          gusts: 22,
          temperature: 7,
          humidity: 58,
          timestamp: now - 5 * 60 * 1000,
          [Type]: 'history',
        },
      ];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      assert.dom('.highcharts-container').exists();
    });

    test('it outlines a point in the wind-speed colour and fills it with the gusts colour only when the bands differ', async function (this: WindDirectionGraphTestContext, assert) {
      const now = Date.now();

      this.data = [
        {
          id: 'same-band',
          direction: 180,
          speed: 2,
          gusts: 2,
          temperature: 6,
          humidity: 60,
          timestamp: now - 10 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'different-band',
          direction: 225,
          speed: 2,
          gusts: 20,
          temperature: 7,
          humidity: 58,
          timestamp: now - 5 * 60 * 1000,
          [Type]: 'history',
        },
      ];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      await waitUntil(() => findAll('.highcharts-point').length >= 2);

      const points = findAll('.highcharts-point');
      const [samePoint, differentPoint] = points;

      assert.strictEqual(
        samePoint?.getAttribute('fill'),
        samePoint?.getAttribute('stroke'),
        'same wind-speed and gusts band: the dot is plain speed-coloured'
      );
      assert.notStrictEqual(
        differentPoint?.getAttribute('fill'),
        differentPoint?.getAttribute('stroke'),
        'different wind-speed and gusts band: the outline is the speed colour and the fill is the gusts colour'
      );
    });

    test('it keeps rendering points in chronological order when switching stations', async function (this: WindDirectionGraphTestContext, assert) {
      const now = Date.now();

      this.data = [
        {
          id: 'station-a:oldest',
          direction: 300,
          speed: 10,
          gusts: 14,
          temperature: 6,
          humidity: 60,
          timestamp: now - 45 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'station-a:middle',
          direction: 120,
          speed: 13,
          gusts: 18,
          temperature: 7,
          humidity: 58,
          timestamp: now - 30 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'station-a:latest',
          direction: 240,
          speed: 16,
          gusts: 22,
          temperature: 8,
          humidity: 55,
          timestamp: now - 10 * 60 * 1000,
          [Type]: 'history',
        },
      ];

      await render(hbs`<Station::WindDirection::Graph @data={{this.data}} />`);

      const firstStationInitialPoints = renderedPointSignature();
      const firstStationInitialGraph = renderedGraphSignature();

      assert.true(firstStationInitialPoints.length > 0);
      assert.true(Boolean(firstStationInitialGraph));

      this.data = [
        {
          id: 'station-b:oldest',
          direction: 225,
          speed: 5,
          gusts: 8,
          temperature: 3,
          humidity: 70,
          timestamp: now - 50 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'station-b:middle',
          direction: 45,
          speed: 7,
          gusts: 11,
          temperature: 4,
          humidity: 68,
          timestamp: now - 25 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'station-b:latest',
          direction: 315,
          speed: 9,
          gusts: 13,
          temperature: 5,
          humidity: 65,
          timestamp: now - 5 * 60 * 1000,
          [Type]: 'history',
        },
      ];

      await settled();

      this.data = [
        {
          id: 'station-a:oldest',
          direction: 300,
          speed: 10,
          gusts: 14,
          temperature: 6,
          humidity: 60,
          timestamp: now - 45 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'station-a:middle',
          direction: 120,
          speed: 13,
          gusts: 18,
          temperature: 7,
          humidity: 58,
          timestamp: now - 30 * 60 * 1000,
          [Type]: 'history',
        },
        {
          id: 'station-a:latest',
          direction: 240,
          speed: 16,
          gusts: 22,
          temperature: 8,
          humidity: 55,
          timestamp: now - 10 * 60 * 1000,
          [Type]: 'history',
        },
      ];

      await settled();

      assert.deepEqual(renderedPointSignature(), firstStationInitialPoints);
      assert.strictEqual(renderedGraphSignature(), firstStationInitialGraph);
    });
  }
);
