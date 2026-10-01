import { module, test } from 'qunit';
import { settled } from '@ember/test-helpers';
import type { NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import RefreshTrackingHandler from 'winds-mobi-client-web/handlers/refresh-tracking';

// `RefreshTrackingHandler.request` is called directly here, with the real
// store as the request's `store` (which is how the handler reaches the
// refresh service) and a faked `next` standing in for the rest of the chain.
function fakeNext<T>(promise: Promise<unknown>): NextFn<T> {
  return (() => promise) as unknown as NextFn<T>;
}

function fakeContext(request: object): RequestContext {
  return { request } as unknown as RequestContext;
}

module('Unit | Handler | refresh-tracking', function (hooks) {
  setupTest(hooks);

  test('it passes a refreshable request through and reports it to the refresh service until it settles', async function (assert) {
    const store = this.owner.lookup('service:store');
    const refresh = this.owner.lookup('service:refresh');
    let resolveFetch!: (value: unknown) => void;
    const fetch = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    const result = RefreshTrackingHandler.request(
      fakeContext({ url: '/x', store, cacheOptions: { types: ['station'] } }),
      fakeNext(fetch)
    );

    assert.strictEqual(
      result,
      fetch,
      'the downstream result is returned as-is'
    );

    await Promise.resolve();

    assert.strictEqual(refresh.refreshCount, 1, 'the fetch started a cycle');
    assert.true(refresh.isRefreshing, 'in flight until the fetch settles');

    resolveFetch({});
    await settled();

    assert.false(refresh.isRefreshing, 'settled once the fetch has');
  });

  test('it ignores requests not marked refreshable (e.g. search)', async function (assert) {
    const store = this.owner.lookup('service:store');
    const refresh = this.owner.lookup('service:refresh');

    await RefreshTrackingHandler.request(
      fakeContext({ url: '/x', store }),
      fakeNext(Promise.resolve({}))
    );
    await settled();

    assert.strictEqual(refresh.refreshCount, 0);
    assert.false(refresh.isRefreshing);
  });
});
