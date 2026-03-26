import { module, test } from 'qunit';
import {
  buildTimeSeriesData,
  sortByNumericValue,
} from 'winds-mobi-client-web/utils/chart-series';

module('Unit | Utility | chart-series', function () {
  test('it sorts rows by the provided numeric value', function (assert) {
    assert.deepEqual(
      sortByNumericValue(
        [
          { label: 'third', value: 3 },
          { label: 'first', value: 1 },
          { label: 'second', value: 2 },
        ],
        (row) => row.value
      ),
      [
        { label: 'first', value: 1 },
        { label: 'second', value: 2 },
        { label: 'third', value: 3 },
      ]
    );
  });

  test('it tolerates missing collections for sorting and series building', function (assert) {
    assert.deepEqual(
      sortByNumericValue<number>(undefined, (value) => value),
      []
    );
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
