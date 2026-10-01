import { module, test } from 'qunit';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import type RefreshService from 'winds-mobi-client-web/services/refresh';

function lookup(context: { owner: { lookup(name: string): unknown } }) {
  return context.owner.lookup('service:refresh') as RefreshService;
}

module('Unit | Service | refresh', function (hooks) {
  setupTest(hooks);

  test('refreshNow is a no-op while inactive: lastRefresh and refreshCount stay unchanged', function (assert) {
    const refresh = lookup(this);

    assert.false(refresh.isActive, 'nothing has called activate() yet');
    assert.strictEqual(refresh.refreshCount, 0);

    refresh.refreshNow();

    assert.strictEqual(
      refresh.refreshCount,
      0,
      'refreshNow does nothing while inactive'
    );
    assert.strictEqual(refresh.lastRefresh, undefined);
  });

  test('refreshNow bumps lastRefresh and refreshCount once active', function (assert) {
    const refresh = lookup(this);
    const token = refresh.activate();

    refresh.refreshNow();

    assert.strictEqual(refresh.refreshCount, 1, 'one refresh has been noted');
    assert.true(
      refresh.lastRefresh instanceof Date,
      'lastRefresh is set once a refresh has happened'
    );

    refresh.deactivate(token);
  });

  test('every refreshNow call while active bumps refreshCount by one and replaces lastRefresh', function (assert) {
    const refresh = lookup(this);
    const token = refresh.activate();

    refresh.refreshNow();
    const firstRefresh = refresh.lastRefresh;

    refresh.refreshNow();
    const secondRefresh = refresh.lastRefresh;

    assert.strictEqual(
      refresh.refreshCount,
      2,
      'refreshCount counts every refresh, not just whether one happened'
    );
    assert.notStrictEqual(
      firstRefresh,
      secondRefresh,
      'lastRefresh is replaced with a new Date on every refresh, which is what lets dependents (e.g. the map/nearby/favorites station-request getters) reactively refetch'
    );

    refresh.deactivate(token);
  });

  test('isActive reflects whether any consumer is currently activated', function (assert) {
    const refresh = lookup(this);

    assert.false(refresh.isActive);

    const tokenA = refresh.activate();
    assert.true(refresh.isActive);

    const tokenB = refresh.activate();
    assert.true(refresh.isActive, 'still active with two consumers');

    refresh.deactivate(tokenA);
    assert.true(
      refresh.isActive,
      'still active while the second consumer holds it open'
    );

    refresh.deactivate(tokenB);
    assert.false(
      refresh.isActive,
      'inactive once every consumer has deactivated'
    );
  });
});
