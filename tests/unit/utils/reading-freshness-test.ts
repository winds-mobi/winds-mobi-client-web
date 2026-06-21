import { module, test } from 'qunit';
import { textClassForReadingAge } from 'winds-mobi-client-web/utils/reading-freshness';

module('Unit | Utility | reading-freshness', function () {
  test('it fades from dark gold to grey as the reading ages', function (assert) {
    const now = Date.now();

    assert.strictEqual(
      textClassForReadingAge(now),
      'text-fresh-0',
      'just-in readings get the brightest gold'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 2 * 60 * 1000),
      'text-fresh-1',
      '2 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 3 * 60 * 1000),
      'text-fresh-2',
      '3 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 5 * 60 * 1000),
      'text-fresh-3',
      '5 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 8 * 60 * 1000),
      'text-fresh-4',
      '8 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 13 * 60 * 1000),
      'text-fresh-5',
      '13 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 21 * 60 * 1000),
      'text-fresh-6',
      '21 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 34 * 60 * 1000),
      'text-fresh-7',
      '34 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 55 * 60 * 1000),
      'text-fresh-8',
      '55 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 90 * 60 * 1000),
      'text-fresh-9',
      'data older than 55 minutes is flat grey'
    );
  });

  test('it treats a non-finite timestamp as stale', function (assert) {
    assert.strictEqual(textClassForReadingAge(NaN), 'text-fresh-9');
  });
});
