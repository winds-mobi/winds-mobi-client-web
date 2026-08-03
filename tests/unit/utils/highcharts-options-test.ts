import { module, test } from 'qunit';
import { Type } from '@warp-drive/core/types/symbols';
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

// windbarbSeriesFor deliberately returns bare {x, value, direction} points
// with no colour or tooltip text baked in -- see chart-series.ts's comment
// on buildWindbarbData for why: those must be derived from whatever
// value/direction Highcharts actually renders (raw or data-grouped), not
// precomputed here, or they silently go stale after grouping (issue: label
// not matching the arrow). Colour (windToColour) and tooltip text
// (azimuthToCardinal + intl) are exercised at the point Highcharts hands
// back, in wind/presenter.gts, not here.
module('Unit | Utility | highcharts-options', function () {
  module('windbarbSeriesFor', function () {
    test('it converts gusts from km/h to m/s', function (assert) {
      const [point] = windbarbSeriesFor([
        historyRow({ timestamp: 1, gusts: 36, direction: 90 }),
      ]);

      assert.strictEqual(point?.value, 10, '36 km/h is 10 m/s');
    });

    test('it passes direction through unchanged', function (assert) {
      const [point] = windbarbSeriesFor([
        historyRow({ timestamp: 1, gusts: 10, direction: 315 }),
      ]);

      assert.strictEqual(point?.direction, 315);
    });

    test('it drops a reading with a non-finite gusts or direction', function (assert) {
      assert.deepEqual(
        windbarbSeriesFor([
          historyRow({ timestamp: 1, gusts: NaN, direction: 90 }),
        ]),
        []
      );
    });
  });
});
