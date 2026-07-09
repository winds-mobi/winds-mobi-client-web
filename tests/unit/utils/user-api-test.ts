import { module, test } from 'qunit';
import { signInUrl, userApiUrl } from 'winds-mobi-client-web/utils/user-api';

module('Unit | Utility | user-api', function () {
  test('userApiUrl builds a path under the winds.mobi user host', function (assert) {
    assert.strictEqual(
      userApiUrl('profile/'),
      'https://winds.mobi/user/profile/'
    );
    assert.strictEqual(userApiUrl(''), 'https://winds.mobi/user/');
  });

  test('signInUrl points at the provider callback with an encoded next param', function (assert) {
    const url = new URL(signInUrl('google'));

    assert.strictEqual(url.origin, 'https://winds.mobi');
    assert.strictEqual(url.pathname, '/user/google/oauth2callback/');
    assert.strictEqual(
      url.searchParams.get('next'),
      `${window.location.origin}/auth/callback`
    );
  });

  test('signInUrl supports both providers', function (assert) {
    assert.true(
      signInUrl('facebook').includes('/user/facebook/oauth2callback/')
    );
    assert.true(signInUrl('google').includes('/user/google/oauth2callback/'));
  });
});
