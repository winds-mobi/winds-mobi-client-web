import { module, test } from 'qunit';
import {
  buildTimeSeriesData,
  buildWindbarbData,
} from 'winds-mobi-client-web/utils/chart-series';

module('Unit | Utility | chart-series', function () {
  test('it preserves the input order for time-series points', function (assert) {
    assert.deepEqual(
      buildTimeSeriesData(
        [
          { timestamp: 3, value: 30 },
          { timestamp: 2, value: 20 },
          { timestamp: 1, value: 10 },
        ],
        (row) => row.timestamp,
        (row) => row.value
      ),
      [
        [3, 30],
        [2, 20],
        [1, 10],
      ]
    );
  });

  test('it tolerates missing collections for series building', function (assert) {
    assert.deepEqual(
      buildTimeSeriesData<number>(
        undefined,
        (row) => row,
        (row) => row
      ),
      []
    );
  });

  module('buildWindbarbData', function () {
    interface WindbarbRow {
      timestamp: number;
      speed: number;
      direction: number;
    }

    function build(rows: WindbarbRow[] | undefined) {
      return buildWindbarbData(
        rows,
        (row) => row.timestamp,
        (row) => row.speed,
        (row) => row.direction
      );
    }

    test('it preserves the input order, including out-of-order timestamps', function (assert) {
      assert.deepEqual(
        build([
          { timestamp: 3, speed: 30, direction: 300 },
          { timestamp: 1, speed: 10, direction: 100 },
          { timestamp: 2, speed: 20, direction: 200 },
        ]),
        [
          { x: 3, value: 30, direction: 300 },
          { x: 1, value: 10, direction: 100 },
          { x: 2, value: 20, direction: 200 },
        ]
      );
    });

    test('it drops points with a non-finite or negative speed', function (assert) {
      assert.deepEqual(
        build([
          { timestamp: 1, speed: NaN, direction: 10 },
          { timestamp: 2, speed: -1, direction: 20 },
          { timestamp: 3, speed: 5, direction: 30 },
        ]),
        [{ x: 3, value: 5, direction: 30 }]
      );
    });

    test('it drops points with a non-finite direction', function (assert) {
      assert.deepEqual(build([{ timestamp: 1, speed: 5, direction: NaN }]), []);
    });

    test('it dedupes by x, keeping the original position', function (assert) {
      const result = build([
        { timestamp: 1, speed: 5, direction: 10 },
        { timestamp: 2, speed: 6, direction: 20 },
        { timestamp: 1, speed: 7, direction: 30 },
      ]);

      assert.deepEqual(
        result.map((point) => point.x),
        [1, 2],
        'the duplicate x stays in its original position rather than moving to the end'
      );
      assert.strictEqual(
        result[0]?.direction,
        30,
        'the later duplicate value wins'
      );
    });

    test('it tolerates missing collections', function (assert) {
      assert.deepEqual(build(undefined), []);
    });
  });
});
