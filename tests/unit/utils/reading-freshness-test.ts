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
      textClassForReadingAge(now - 1.5 * 60 * 1000),
      'text-fresh-1',
      '1.5 minutes old'
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
      textClassForReadingAge(now - 10 * 60 * 1000),
      'text-fresh-4',
      '10 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 15 * 60 * 1000),
      'text-fresh-5',
      '15 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 30 * 60 * 1000),
      'text-fresh-6',
      '30 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 60 * 60 * 1000),
      'text-fresh-7',
      'exactly 1 hour old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - 90 * 60 * 1000),
      'text-fresh-8',
      'data older than 1 hour is flat grey'
    );
  });

  test('it treats a non-finite timestamp as stale', function (assert) {
    assert.strictEqual(textClassForReadingAge(NaN), 'text-fresh-8');
  });
});
