import { module, test } from 'qunit';
import {
  getAuthToken,
  setAuthToken,
} from 'winds-mobi-client-web/utils/auth-token';

module('Unit | Utility | auth-token', function (hooks) {
  hooks.afterEach(function () {
    setAuthToken(null);
  });

  test('it has no token by default', function (assert) {
    assert.strictEqual(getAuthToken(), null);
  });

  test('it mirrors whatever token was last set', function (assert) {
    setAuthToken('jwt-123');

    assert.strictEqual(getAuthToken(), 'jwt-123');

    setAuthToken(null);

    assert.strictEqual(getAuthToken(), null);
  });
});
