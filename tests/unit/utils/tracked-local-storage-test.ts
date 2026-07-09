import { module, test } from 'qunit';
import { trackedInLocalStorage } from 'winds-mobi-client-web/utils/tracked-local-storage';

// Each test uses its own storage key: the decorator caches one reactive cell
// per key at module scope (by design, so instances sharing a key share
// state), so reusing a key across tests would leak the cell from one test
// into the next instead of re-seeding from storage.
function exampleClassFor(keyName: string) {
  class Example {
    @trackedInLocalStorage({ keyName })
    flag = true;
  }

  return Example;
}

module('Unit | Utility | tracked-local-storage', function (hooks) {
  const usedKeys = new Set<string>();

  function keyFor(name: string) {
    const key = `test.tracked-local-storage.${name}`;
    usedKeys.add(key);
    return key;
  }

  hooks.afterEach(function () {
    for (const key of usedKeys) {
      globalThis.localStorage?.removeItem(key);
    }
    usedKeys.clear();
  });

  test('it reads the property initializer as the default', function (assert) {
    const key = keyFor('default');
    const Example = exampleClassFor(key);

    assert.true(new Example().flag);
    assert.strictEqual(globalThis.localStorage.getItem(key), null);
  });

  test('writing a non-default value persists it', function (assert) {
    const key = keyFor('write');
    const Example = exampleClassFor(key);
    const example = new Example();

    example.flag = false;

    assert.false(example.flag);
    assert.strictEqual(globalThis.localStorage.getItem(key), 'false');
  });

  test('writing back the default value removes it from storage', function (assert) {
    const key = keyFor('revert');
    const Example = exampleClassFor(key);
    const example = new Example();

    example.flag = false;
    example.flag = true;

    assert.true(example.flag);
    assert.strictEqual(globalThis.localStorage.getItem(key), null);
  });

  test('a new instance seeds from a previously persisted value', function (assert) {
    const key = keyFor('seed');

    globalThis.localStorage.setItem(key, 'false');

    const Example = exampleClassFor(key);

    assert.false(new Example().flag);
  });

  test('malformed stored JSON falls back to the default', function (assert) {
    const key = keyFor('malformed');

    globalThis.localStorage.setItem(key, '{not json');

    const Example = exampleClassFor(key);

    assert.true(new Example().flag);
  });

  test('instances sharing a key share reactive state', function (assert) {
    const key = keyFor('shared');
    const Example = exampleClassFor(key);
    const first = new Example();
    const second = new Example();

    first.flag = false;

    assert.false(second.flag, 'the second instance sees the same value');
  });
});
