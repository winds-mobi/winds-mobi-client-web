import { module, test } from 'qunit';
import { locationErrorTranslationKey } from 'winds-mobi-client-web/utils/location-error-translation-key';

module('Unit | Utility | location-error-translation-key', function () {
  test('it returns undefined when there is no error', function (assert) {
    assert.strictEqual(locationErrorTranslationKey('nearby.error'), undefined);
  });

  test('it maps each error code to a translation suffix', function (assert) {
    assert.strictEqual(
      locationErrorTranslationKey('nearby.error', 'permission-denied'),
      'nearby.error.permissionDenied'
    );
    assert.strictEqual(
      locationErrorTranslationKey('nearby.error', 'position-unavailable'),
      'nearby.error.positionUnavailable'
    );
    assert.strictEqual(
      locationErrorTranslationKey('nearby.error', 'timeout'),
      'nearby.error.timeout'
    );
    assert.strictEqual(
      locationErrorTranslationKey('nearby.error', 'unsupported'),
      'nearby.error.unsupported'
    );
    assert.strictEqual(
      locationErrorTranslationKey('nearby.error', 'unknown'),
      'nearby.error.unknownError'
    );
  });
});
