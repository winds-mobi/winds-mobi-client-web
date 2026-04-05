import { module, test } from 'qunit';
import { searchQuery } from 'winds-mobi-client-web/builders/station';

module('Unit | Builder | station', function () {
  test('searchQuery builds a lightweight repeated-keys station search URL', function (assert) {
    const request = searchQuery('station', ' leh ') as { url: string };
    const url = new URL(request.url, 'https://winds.mobi');

    assert.strictEqual(url.searchParams.get('search'), 'leh');
    assert.strictEqual(url.searchParams.get('limit'), '8');
    assert.strictEqual(
      url.searchParams.get('is-highest-duplicates-rating'),
      'true'
    );
    assert.deepEqual(url.searchParams.getAll('keys').sort(), [
      'alt',
      'last._id',
      'last.w-avg',
      'last.w-dir',
      'last.w-max',
      'loc',
      'peak',
      'short',
      'status',
    ]);
    assert.false(url.searchParams.has('within-pt1-lat'));
    assert.false(url.searchParams.has('within-pt1-lon'));
    assert.false(url.searchParams.has('within-pt2-lat'));
    assert.false(url.searchParams.has('within-pt2-lon'));
  });
});
