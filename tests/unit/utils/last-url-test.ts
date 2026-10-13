import { module, test } from 'qunit';
import type { Registry as Services } from '@ember/service';
import {
  rememberedUrl,
  rememberUrl,
} from 'winds-mobi-client-web/utils/last-url';

function fakeStorage() {
  const items = new Map<string, unknown>();

  return {
    items,
    storage: {
      getItem: (key: string) => items.get(key),
      setItem: (key: string, value: unknown) => items.set(key, value),
    } as unknown as Services['tracked-local-storage'],
  };
}

module('Unit | Utility | last-url', function () {
  test('it reads back a remembered URL', function (assert) {
    const { storage } = fakeStorage();

    assert.strictEqual(rememberedUrl(storage), undefined);

    rememberUrl(storage, '/map/holfuy-1804?zoom=9');

    assert.strictEqual(rememberedUrl(storage), '/map/holfuy-1804?zoom=9');
  });

  test('it ignores the root and anything that is not an app path', function (assert) {
    const { items, storage } = fakeStorage();

    for (const value of ['/', 'https://example.com/', 42, null]) {
      items.set('app.lastUrl', value);

      assert.strictEqual(rememberedUrl(storage), undefined, String(value));
    }
  });
});
