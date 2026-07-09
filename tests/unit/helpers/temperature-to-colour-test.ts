import { module, test } from 'qunit';
import {
  temperatureBandFor,
  temperatureColourZones,
  temperatureToTextClass,
} from 'winds-mobi-client-web/helpers/temperature-to-colour';

module('Unit | Helper | temperature-to-colour', function () {
  test('it picks the band whose max the value is strictly below', function (assert) {
    assert.strictEqual(temperatureBandFor(-20).textClass, 'text-violet-300');
    assert.strictEqual(temperatureBandFor(-5).textClass, 'text-sky-300');
    assert.strictEqual(temperatureBandFor(5).textClass, 'text-blue-700');
    assert.strictEqual(temperatureBandFor(15).textClass, 'text-green-600');
    assert.strictEqual(temperatureBandFor(25).textClass, 'text-yellow-500');
    assert.strictEqual(temperatureBandFor(35).textClass, 'text-orange-500');
    assert.strictEqual(temperatureBandFor(45).textClass, 'text-red-600');
  });

  test('band boundaries fall into the next (higher) band', function (assert) {
    assert.strictEqual(temperatureBandFor(0).textClass, 'text-blue-700');
    assert.strictEqual(temperatureBandFor(10).textClass, 'text-green-600');
    assert.strictEqual(temperatureBandFor(40).textClass, 'text-red-600');
  });

  test('temperatureToTextClass mirrors temperatureBandFor', function (assert) {
    assert.strictEqual(temperatureToTextClass(25), 'text-yellow-500');
  });

  test('temperatureColourZones is ordered ascending and open-ended at the top', function (assert) {
    const zones = temperatureColourZones();

    assert.strictEqual(zones.length, 7);
    assert.deepEqual(
      zones.slice(0, -1).map((zone) => zone.value),
      [-10, 0, 10, 20, 30, 40]
    );
    assert.strictEqual(zones[zones.length - 1]?.value, undefined);
  });
});
