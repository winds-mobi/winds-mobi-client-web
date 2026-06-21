import { module, test } from 'qunit';
import { textClassForReadingAge } from 'winds-mobi-client-web/utils/reading-freshness';

module('Unit | Utility | reading-freshness', function () {
  test('it fades from dark gold to grey as the reading ages', function (assert) {
    const now = Date.now();

    assert.strictEqual(
      textClassForReadingAge(now),
      'text-fresh-0',
      'just-in readings get the darkest gold'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 4 * 60 * 1000),
      'text-fresh-1',
      '4 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 8 * 60 * 1000),
      'text-fresh-2',
      '8 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 15 * 60 * 1000),
      'text-fresh-3',
      '15 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 30 * 60 * 1000),
      'text-fresh-4',
      '30 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 60 * 60 * 1000),
      'text-fresh-5',
      '1 hour old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 2 * 60 * 60 * 1000),
      'text-fresh-6',
      '2 hours old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 12 * 60 * 60 * 1000),
      'text-fresh-7',
      '12 hours old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 25 * 60 * 60 * 1000),
      'text-fresh-8',
      'stale (24h+) readings get the same grey as stale map markers'
    );
  });

  test('it treats a non-finite timestamp as stale', function (assert) {
    assert.strictEqual(textClassForReadingAge(NaN), 'text-fresh-8');
  });
});
