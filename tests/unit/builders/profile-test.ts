// TODO: Remove login — backs the disabled sign-in feature (see
// app/services/session.ts); favorites now persist locally instead (see
// app/services/favorites.ts). Kept for reference/restoration.
/*
import { module, test } from 'qunit';
import { SkipCache } from '@warp-drive/core/types/request';
import {
  addFavorite,
  profileQuery,
  removeFavorite,
} from 'winds-mobi-client-web/builders/profile';

module('Unit | Builder | profile', function () {
  test('profileQuery reads the user API profile endpoint', function (assert) {
    const request = profileQuery();

    assert.strictEqual(request.url, 'https://winds.mobi/user/profile/');
    assert.strictEqual(request.method, 'GET');
    assert.strictEqual(request.op, 'query');
    assert.deepEqual(request.cacheOptions, { types: ['profile'] });
    assert.strictEqual(
      new Headers(request.headers).get('accept'),
      'application/json'
    );
  });

  test('addFavorite posts to the station favorite endpoint and skips the cache', function (assert) {
    const request = addFavorite('holfuy-1850');

    assert.strictEqual(
      request.url,
      'https://winds.mobi/user/profile/favorites/holfuy-1850/'
    );
    assert.strictEqual(request.method, 'POST');
    assert.true(request.cacheOptions[SkipCache]);
  });

  test('removeFavorite deletes the station favorite endpoint and skips the cache', function (assert) {
    const request = removeFavorite('holfuy-1850');

    assert.strictEqual(
      request.url,
      'https://winds.mobi/user/profile/favorites/holfuy-1850/'
    );
    assert.strictEqual(request.method, 'DELETE');
    assert.true(request.cacheOptions[SkipCache]);
  });

  test('favorite mutations URL-encode the station id', function (assert) {
    const request = addFavorite('tricky/id?');

    assert.strictEqual(
      request.url,
      'https://winds.mobi/user/profile/favorites/tricky%2Fid%3F/'
    );
  });
});
*/
