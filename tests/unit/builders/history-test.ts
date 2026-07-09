import { module, test } from 'qunit';
import { historyQuery } from 'winds-mobi-client-web/builders/history';

module('Unit | Builder | history', function () {
  test('it builds the historic endpoint for the given station', function (assert) {
    const request = historyQuery('history', 'holfuy-1850') as {
      url: string;
      method?: string;
      op?: string;
    };
    const url = new URL(request.url, 'https://winds.mobi');

    assert.strictEqual(
      url.origin + url.pathname,
      'https://winds.mobi/api/2.3/stations/holfuy-1850/historic/'
    );
    assert.strictEqual(request.op, 'query');
  });

  test('it applies the default keys and duration', function (assert) {
    const request = historyQuery('history', 'holfuy-1850') as {
      url: string;
    };
    const url = new URL(request.url, 'https://winds.mobi');

    assert.deepEqual(url.searchParams.getAll('keys').sort(), [
      'hum',
      'temp',
      'w-avg',
      'w-dir',
      'w-max',
    ]);
    assert.strictEqual(url.searchParams.get('duration'), '435600');
  });

  test('a given query overrides the matching defaults only', function (assert) {
    const request = historyQuery('history', 'holfuy-1850', {
      keys: ['w-dir', 'w-avg', 'w-max'],
      duration: 3600,
    }) as { url: string };
    const url = new URL(request.url, 'https://winds.mobi');

    assert.deepEqual(url.searchParams.getAll('keys').sort(), [
      'w-avg',
      'w-dir',
      'w-max',
    ]);
    assert.strictEqual(url.searchParams.get('duration'), '3600');
  });

  test('given options are merged into the request', function (assert) {
    const request = historyQuery('history', 'holfuy-1850', undefined, {
      backgroundReload: true,
    }) as {
      url: string;
      cacheOptions?: { backgroundReload?: boolean };
    };
    const url = new URL(request.url, 'https://winds.mobi');

    assert.true(request.cacheOptions?.backgroundReload);
    // `arrayFormat: 'repeat'` survives the merge: each key is its own param.
    assert.strictEqual(url.searchParams.getAll('keys').length, 5);
  });
});
