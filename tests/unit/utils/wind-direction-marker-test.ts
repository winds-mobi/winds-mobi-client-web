import { module, test } from 'qunit';
import { windDirectionMarkerColours } from 'winds-mobi-client-web/utils/wind-direction-marker';

module('Unit | Utility | wind-direction-marker', function () {
  test('it returns a plain speed-coloured marker when gusts share the wind-speed band', function (assert) {
    const { lineColor, fillColor } = windDirectionMarkerColours(2, 2);

    assert.strictEqual(lineColor, fillColor);
  });

  test('it fills the marker with the gusts colour when gusts fall in a different wind band', function (assert) {
    const { lineColor, fillColor } = windDirectionMarkerColours(2, 20);

    assert.notStrictEqual(lineColor, fillColor);
  });
});
