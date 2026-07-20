import { module, test } from 'qunit';
import {
  favoritesQuery,
  findRecord,
  mapQuery,
  searchQuery,
} from 'winds-mobi-client-web/builders/station';

module('Unit | Builder | station', function () {
  test('findRecord and query-based builders end in a trailing slash before the query string', function (assert) {
    // The winds.mobi API 307-redirects slash-less collection/resource URLs,
    // doubling every call (see GitHub issue #110) — the trailing slash must stay.
    const findRecordRequest = findRecord('station', 'holfuy-1850') as {
      url: string;
    };
    assert.true(
      new URL(findRecordRequest.url, 'https://winds.mobi').pathname.endsWith(
        '/'
      ),
      'findRecord URL path ends with /'
    );

    const mapQueryRequest = mapQuery('station', {
      northEast: [7.9, 46.7],
      southWest: [7.8, 46.6],
    }) as { url: string };
    assert.true(
      new URL(mapQueryRequest.url, 'https://winds.mobi').pathname.endsWith('/'),
      'query-based URL path ends with /'
    );
  });

  test('favoritesQuery fetches exactly the given station ids', function (assert) {
    const request = favoritesQuery('station', ['holfuy-1850', 'jdc-1001']) as {
      url: string;
    };
    const url = new URL(request.url, 'https://winds.mobi');

    assert.deepEqual(url.searchParams.getAll('ids').sort(), [
      'holfuy-1850',
      'jdc-1001',
    ]);
    assert.strictEqual(url.searchParams.get('limit'), '2');
    assert.false(
      url.searchParams.has('is-highest-duplicates-rating'),
      'the user picked these exact stations — no duplicates filtering'
    );
    assert.true(
      url.searchParams.getAll('keys').includes('short'),
      'the default station keys are requested'
    );
  });

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

  test('searchQuery omits the location bias when no position is given', function (assert) {
    const request = searchQuery('station', 'leh') as { url: string };
    const url = new URL(request.url, 'https://winds.mobi');

    assert.false(url.searchParams.has('near-lat'));
    assert.false(url.searchParams.has('near-lon'));
  });

  test('searchQuery biases toward a known position when one is given', function (assert) {
    const request = searchQuery('station', 'leh', {
      latitude: 46.68084,
      longitude: 7.82554,
    }) as { url: string };
    const url = new URL(request.url, 'https://winds.mobi');

    assert.strictEqual(url.searchParams.get('near-lat'), '46.68084');
    assert.strictEqual(url.searchParams.get('near-lon'), '7.82554');
    assert.strictEqual(url.searchParams.get('search'), 'leh');
  });
});
