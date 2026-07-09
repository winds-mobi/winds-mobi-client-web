import { module, test } from 'qunit';
import azimuthToCardinal, {
  DIRECTIONS,
} from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';

module('Unit | Helper | azimuth-to-cardinal', function () {
  test('it maps the eight compass points', function (assert) {
    assert.strictEqual(azimuthToCardinal(0), 'N');
    assert.strictEqual(azimuthToCardinal(45), 'NE');
    assert.strictEqual(azimuthToCardinal(90), 'E');
    assert.strictEqual(azimuthToCardinal(135), 'SE');
    assert.strictEqual(azimuthToCardinal(180), 'S');
    assert.strictEqual(azimuthToCardinal(225), 'SW');
    assert.strictEqual(azimuthToCardinal(270), 'W');
    assert.strictEqual(azimuthToCardinal(315), 'NW');
  });

  test('it wraps back to north near 360', function (assert) {
    assert.strictEqual(azimuthToCardinal(360), 'N');
    assert.strictEqual(azimuthToCardinal(350), 'N');
  });

  test('it rounds to the nearest direction', function (assert) {
    assert.strictEqual(azimuthToCardinal(20), 'N');
    assert.strictEqual(azimuthToCardinal(26), 'NE');
  });

  test('DIRECTIONS lists all eight compass points in order', function (assert) {
    assert.deepEqual(DIRECTIONS, ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);
  });
});
