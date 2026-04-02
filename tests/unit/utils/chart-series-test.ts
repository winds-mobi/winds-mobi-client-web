import { module, test } from 'qunit';
import { buildTimeSeriesData } from 'winds-mobi-client-web/utils/chart-series';

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
});
