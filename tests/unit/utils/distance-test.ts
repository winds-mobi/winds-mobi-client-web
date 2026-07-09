import { module, test } from 'qunit';
import { distanceKm } from 'winds-mobi-client-web/utils/distance';

module('Unit | Utility | distance', function () {
  test('the distance from a point to itself is zero', function (assert) {
    assert.strictEqual(distanceKm(46.521, 6.632, 46.521, 6.632), 0);
  });

  test('it computes the great-circle distance between two points', function (assert) {
    // Geneva to Zurich, actual ~224km great-circle distance.
    const geneva = { latitude: 46.2044, longitude: 6.1432 };
    const zurich = { latitude: 47.3769, longitude: 8.5417 };

    const distance = distanceKm(
      geneva.latitude,
      geneva.longitude,
      zurich.latitude,
      zurich.longitude
    );

    assert.true(
      Math.abs(distance - 224) < 2,
      `expected ~224km, got ${distance}`
    );
  });

  test('it is symmetric', function (assert) {
    const geneva = { latitude: 46.2044, longitude: 6.1432 };
    const zurich = { latitude: 47.3769, longitude: 8.5417 };

    assert.strictEqual(
      distanceKm(
        geneva.latitude,
        geneva.longitude,
        zurich.latitude,
        zurich.longitude
      ),
      distanceKm(
        zurich.latitude,
        zurich.longitude,
        geneva.latitude,
        geneva.longitude
      )
    );
  });
});
