import { module, test } from 'qunit';
import { waitUntil } from '@ember/test-helpers';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import type RefreshService from 'winds-mobi-client-web/services/refresh';

function lookup(context: { owner: { lookup(name: string): unknown } }) {
  return context.owner.lookup('service:refresh') as RefreshService;
}

// Records which request types the service invalidates on the real store's
// cache policy, instead of letting it invalidate anything.
function spyOnInvalidation(refresh: RefreshService): string[] {
  const invalidated: string[] = [];

  refresh.store.lifetimes.invalidateRequestsForType = (type: string) => {
    invalidated.push(type);
  };

  return invalidated;
}

module('Unit | Service | refresh', function (hooks) {
  setupTest(hooks);

  test('refreshNow restarts the countdown and invalidates every station and history request', function (assert) {
    const refresh = lookup(this);
    const invalidated = spyOnInvalidation(refresh);
    const before = refresh.lastRefreshAt;

    refresh.refreshNow();

    assert.deepEqual(invalidated, ['station', 'history']);
    assert.notStrictEqual(refresh.lastRefreshAt, before);
    assert.strictEqual(refresh.elapsedMs, 0);
  });

  test('a fetch while nothing is in flight opens a refresh cycle', function (assert) {
    const refresh = lookup(this);
    const invalidated = spyOnInvalidation(refresh);

    assert.false(refresh.isRefreshing, 'nothing in flight yet');

    const done = refresh.fetchStarted();

    assert.strictEqual(refresh.refreshCount, 1, 'a cycle was counted');
    assert.deepEqual(
      invalidated,
      ['station', 'history'],
      'everything else on screen re-fetches with it'
    );
    assert.true(refresh.isRefreshing, 'true while the fetch is in flight');

    done();

    assert.false(refresh.isRefreshing, 'false once it has settled');
  });

  test('a fetch while a cycle is open joins it instead of starting another', function (assert) {
    const refresh = lookup(this);
    const invalidated = spyOnInvalidation(refresh);

    const doneA = refresh.fetchStarted();
    const doneB = refresh.fetchStarted();

    assert.strictEqual(refresh.refreshCount, 1, 'still one cycle');
    assert.strictEqual(invalidated.length, 2, 'invalidated only once');

    doneA();
    assert.true(refresh.isRefreshing, 'still refreshing until both settle');

    doneB();
    assert.false(refresh.isRefreshing);
  });

  test('a fetch right after the previous one settled still joins its cycle; a later one opens a new cycle', async function (assert) {
    const refresh = lookup(this);

    spyOnInvalidation(refresh);
    refresh.cycleGraceMs = 20;

    refresh.fetchStarted()();
    // A request waterfall: the child fetch starts just after its parent settled.
    refresh.fetchStarted()();

    assert.strictEqual(refresh.refreshCount, 1, 'the child joined');

    await new Promise((resolve) => setTimeout(resolve, 40));
    refresh.fetchStarted()();

    assert.strictEqual(refresh.refreshCount, 2, 'a later fetch is its own');
  });

  test('the countdown refreshes once the interval elapses, until stopped', async function (assert) {
    const refresh = lookup(this);
    const invalidated = spyOnInvalidation(refresh);

    refresh.refreshIntervalMs = 30;
    refresh.countdownTickMs = 5;

    const stop = refresh.start();

    await waitUntil(() => invalidated.length > 0);
    stop();

    assert.deepEqual(invalidated.slice(0, 2), ['station', 'history']);
    assert.false(refresh.refreshLoop.isRunning, 'stopped with the teardown');
  });
});
