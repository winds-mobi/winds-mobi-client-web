import { module, test } from 'qunit';
import windToColour, {
  windBandForSpeed,
  windColourZones,
  windLegendBands,
  windToBackgroundClass,
  windToTextClass,
  WIND_COLOUR_BANDS,
} from 'winds-mobi-client-web/helpers/wind-to-colour';

module('Unit | Helper | wind-to-colour', function () {
  test('it picks the band whose max the speed is strictly below', function (assert) {
    assert.strictEqual(windBandForSpeed(2).key, 'wind-05');
    assert.strictEqual(windBandForSpeed(7).key, 'wind-10');
    assert.strictEqual(windBandForSpeed(48).key, 'wind-50');
  });

  test('band boundaries fall into the next (higher) band', function (assert) {
    assert.strictEqual(windBandForSpeed(5).key, 'wind-10');
    assert.strictEqual(windBandForSpeed(50).key, 'wind-50');
  });

  test('bands are contiguous from zero with no gaps', function (assert) {
    assert.strictEqual(WIND_COLOUR_BANDS[0]?.min, 0);

    for (let i = 1; i < WIND_COLOUR_BANDS.length; i++) {
      assert.strictEqual(
        WIND_COLOUR_BANDS[i]?.min,
        WIND_COLOUR_BANDS[i - 1]?.max,
        `band ${i} starts where band ${i - 1} ends`
      );
    }
  });

  test('windToColour/windToBackgroundClass/windToTextClass mirror the matched band', function (assert) {
    const band = windBandForSpeed(12);

    assert.strictEqual(windToColour(12), band.color);
    assert.strictEqual(windToBackgroundClass(12), band.backgroundClass);
    assert.strictEqual(windToTextClass(12), band.textClass);
  });

  test('windColourZones is ordered ascending and open-ended at the top', function (assert) {
    const zones = windColourZones();

    assert.strictEqual(zones.length, WIND_COLOUR_BANDS.length);
    assert.strictEqual(
      zones[zones.length - 1]?.value,
      undefined,
      'the last zone has no upper bound'
    );
    assert.deepEqual(
      zones.slice(0, -1).map((zone) => zone.value),
      WIND_COLOUR_BANDS.slice(0, -1).map((band) => band.max)
    );
  });

  test('windLegendBands labels the open-ended top band with a plus', function (assert) {
    const bands = windLegendBands();

    assert.strictEqual(bands[0]?.label, '5');
    assert.strictEqual(bands[bands.length - 1]?.label, '45+');
  });
});
