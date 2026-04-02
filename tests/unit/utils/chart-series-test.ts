import { module, test } from 'qunit';
import { buildTimeSeriesData } from 'winds-mobi-client-web/utils/chart-series';

module('Unit | Utility | chart-series', function () {
  test('it keeps time-series points in chronological order from newest-first API rows', function (assert) {
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
        [1, 10],
        [2, 20],
        [3, 30],
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
