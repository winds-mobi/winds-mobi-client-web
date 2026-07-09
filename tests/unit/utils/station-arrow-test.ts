import { module, test } from 'qunit';
import {
  colourForWindReading,
  MIN_MARKER_SCALE,
  scaleForReadingAge,
  STALE_STATION_COLOUR,
} from 'winds-mobi-client-web/utils/station-arrow';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';

module('Unit | Utility | station-arrow', function () {
  module('scaleForReadingAge', function () {
    test('a fresh reading is drawn full size', function (assert) {
      assert.strictEqual(scaleForReadingAge(Date.now()), 1);
    });

    test('a future or non-finite timestamp is treated as fresh', function (assert) {
      assert.strictEqual(scaleForReadingAge(Date.now() + 60_000), 1);
      assert.strictEqual(scaleForReadingAge(Number.NaN), 1);
    });

    test('it shrinks linearly toward the floor', function (assert) {
      const scale = scaleForReadingAge(Date.now() - 15 * 60 * 1000);

      assert.true(
        scale < 1 && scale > MIN_MARKER_SCALE,
        `expected a mid-shrink scale, got ${scale}`
      );
    });

    test('it holds the floor once fully shrunk', function (assert) {
      assert.strictEqual(
        scaleForReadingAge(Date.now() - 60 * 60 * 1000),
        MIN_MARKER_SCALE
      );
      assert.strictEqual(
        scaleForReadingAge(Date.now() - 24 * 60 * 60 * 1000),
        MIN_MARKER_SCALE
      );
    });
  });

  module('colourForWindReading', function () {
    test('a fresh reading uses the wind-speed colour', function (assert) {
      assert.strictEqual(
        colourForWindReading(12, Date.now()),
        windToColour(12)
      );
    });

    test('a day-old-or-older reading is drawn stale grey', function (assert) {
      assert.strictEqual(
        colourForWindReading(12, Date.now() - 25 * 60 * 60 * 1000),
        STALE_STATION_COLOUR
      );
    });

    test('a non-finite timestamp is treated as fresh', function (assert) {
      assert.strictEqual(
        colourForWindReading(12, Number.NaN),
        windToColour(12)
      );
    });
  });
});
