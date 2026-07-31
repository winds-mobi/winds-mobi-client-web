import { module, test } from 'qunit';
import { windDirectionMarkerColours } from 'winds-mobi-client-web/utils/wind-direction-marker';

module('Unit | Utility | wind-direction-marker', function () {
  test('it leaves the marker center a hollow (background-coloured) ring when gusts share the wind-speed band', function (assert) {
    const { lineColor, fillColor } = windDirectionMarkerColours(2, 2);

    assert.notStrictEqual(fillColor, lineColor);
    assert.strictEqual(fillColor, 'white');
  });

  test('it fills the marker with the gusts colour when gusts fall in a different wind band', function (assert) {
    const { lineColor, fillColor } = windDirectionMarkerColours(2, 20);

    assert.notStrictEqual(lineColor, fillColor);
  });
});
