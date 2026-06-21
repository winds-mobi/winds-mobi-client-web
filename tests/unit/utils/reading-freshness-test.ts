import { module, test } from 'qunit';
import { textClassForReadingAge } from 'winds-mobi-client-web/utils/reading-freshness';

module('Unit | Utility | reading-freshness', function () {
  test('it fades from dark gold to grey as the reading ages', function (assert) {
    const now = Date.now();

    // Ages are kept a few seconds inside each band's upper bound (rather than
    // exactly on the boundary) so the assertions stay stable even though
    // textClassForReadingAge() re-reads Date.now() on every call and a test
    // run accumulates a little real elapsed time between assertions.
    const buffer = 5 * 1000;

    assert.strictEqual(
      textClassForReadingAge(now),
      'text-fresh-0',
      'just-in readings get the brightest gold'
    );
    assert.strictEqual(
      textClassForReadingAge(now - (2 * 60 * 1000 - buffer)),
      'text-fresh-1',
      'just under 2 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - (3 * 60 * 1000 - buffer)),
      'text-fresh-2',
      'just under 3 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - (5 * 60 * 1000 - buffer)),
      'text-fresh-3',
      'just under 5 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - (8 * 60 * 1000 - buffer)),
      'text-fresh-4',
      'just under 8 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - (13 * 60 * 1000 - buffer)),
      'text-fresh-5',
      'just under 13 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - (21 * 60 * 1000 - buffer)),
      'text-fresh-6',
      'just under 21 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - (34 * 60 * 1000 - buffer)),
      'text-fresh-7',
      'just under 34 minutes old'
    );
    assert.strictEqual(
      textClassForReadingAge(now - (55 * 60 * 1000 - buffer)),
      'text-fresh-8',
      'just under 55 minutes old'
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
