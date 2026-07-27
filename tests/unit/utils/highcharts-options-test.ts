import { module, test } from 'qunit';
import type { TestContext } from '@ember/test-helpers';
import { Type } from '@warp-drive/core/types/symbols';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import { windbarbSeriesFor } from 'winds-mobi-client-web/utils/highcharts-options';
import type { History } from 'winds-mobi-client-web/services/store';

function historyRow(overrides: Partial<History>): History {
  return {
    id: 'history-1',
    direction: 0,
    speed: 0,
    gusts: 0,
    temperature: 0,
    humidity: 0,
    rain: 0,
    timestamp: 0,
    [Type]: 'history',
    ...overrides,
  };
}

module('Unit | Utility | highcharts-options', function (hooks) {
  setupTest(hooks);

  module('windbarbSeriesFor', function () {
    test('it converts speed from km/h to m/s', function (this: TestContext, assert) {
      const intl = this.owner.lookup('service:intl');

      const [point] = windbarbSeriesFor(
        [historyRow({ timestamp: 1, speed: 36, direction: 90 })],
        intl
      );

      assert.strictEqual(point?.value, 10, '36 km/h is 10 m/s');
    });

    test('it colours each point by its own wind speed', function (this: TestContext, assert) {
      const intl = this.owner.lookup('service:intl');

      const [calm, strong] = windbarbSeriesFor(
        [
          historyRow({ timestamp: 1, speed: 2, direction: 0 }),
          historyRow({ timestamp: 2, speed: 60, direction: 0 }),
        ],
        intl
      );

      assert.notStrictEqual(
        calm?.color,
        strong?.color,
        'a calm reading and a strong reading fall into different wind-speed colour bands'
      );
    });

    test('it builds a cardinal + degrees tooltip for each direction', function (this: TestContext, assert) {
      const intl = this.owner.lookup('service:intl');

      const [point] = windbarbSeriesFor(
        [historyRow({ timestamp: 1, speed: 10, direction: 315 })],
        intl
      );

      assert.strictEqual(point?.customTooltip, 'NW 315°');
    });

    test('it drops a reading with a non-finite speed or direction', function (this: TestContext, assert) {
      const intl = this.owner.lookup('service:intl');

      assert.deepEqual(
        windbarbSeriesFor(
          [historyRow({ timestamp: 1, speed: NaN, direction: 90 })],
          intl
        ),
        []
      );
    });
  });
});
