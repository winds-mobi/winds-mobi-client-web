import { module, test } from 'qunit';
import {
  colourForWindReading,
  MIN_MARKER_SCALE,
  MIN_ZOOM_MARKER_SCALE,
  scaleForReadingAge,
  scaleForZoom,
  STALE_STATION_COLOUR,
} from 'winds-mobi-client-web/utils/station-arrow';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';

module('Unit | Utility | station-arrow', function () {
  module('scaleForZoom', function () {
    test('draws full size once zoomed in close', function (assert) {
      assert.strictEqual(scaleForZoom(13), 1);
      assert.strictEqual(scaleForZoom(17), 1);
    });

    test('shrinks in discrete steps as zoom decreases', function (assert) {
      assert.strictEqual(scaleForZoom(12.9), 0.8);
      assert.strictEqual(scaleForZoom(11), 0.8);
      assert.strictEqual(scaleForZoom(10.9), 0.65);
      assert.strictEqual(scaleForZoom(9), 0.65);
      assert.strictEqual(scaleForZoom(8.9), 0.5);
      assert.strictEqual(scaleForZoom(7), 0.5);
    });

    test('holds the floor once zoomed out past the lowest step', function (assert) {
      assert.strictEqual(scaleForZoom(6.9), MIN_ZOOM_MARKER_SCALE);
      assert.strictEqual(scaleForZoom(0), MIN_ZOOM_MARKER_SCALE);
    });

    test('a non-finite zoom is treated as full size', function (assert) {
      assert.strictEqual(scaleForZoom(Number.NaN), 1);
    });
  });

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
