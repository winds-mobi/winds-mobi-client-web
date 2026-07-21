import { module, test } from 'qunit';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

function lookup(context: { owner: { lookup(name: string): unknown } }) {
  return context.owner.lookup('service:map-refresh') as MapRefreshService;
}

module('Unit | Service | map-refresh', function (hooks) {
  setupTest(hooks);

  test('refreshNow is a no-op while inactive: lastRefresh and refreshCount stay unchanged', function (assert) {
    const mapRefresh = lookup(this);

    assert.false(mapRefresh.isActive, 'nothing has called activate() yet');
    assert.strictEqual(mapRefresh.refreshCount, 0);

    mapRefresh.refreshNow();

    assert.strictEqual(
      mapRefresh.refreshCount,
      0,
      'refreshNow does nothing while inactive'
    );
    assert.strictEqual(mapRefresh.lastRefresh, undefined);
  });

  test('refreshNow bumps lastRefresh and refreshCount once active', function (assert) {
    const mapRefresh = lookup(this);
    const token = mapRefresh.activate();

    mapRefresh.refreshNow();

    assert.strictEqual(
      mapRefresh.refreshCount,
      1,
      'one refresh has been noted'
    );
    assert.true(
      mapRefresh.lastRefresh instanceof Date,
      'lastRefresh is set once a refresh has happened'
    );

    mapRefresh.deactivate(token);
  });

  test('every refreshNow call while active bumps refreshCount by one and replaces lastRefresh', function (assert) {
    const mapRefresh = lookup(this);
    const token = mapRefresh.activate();

    mapRefresh.refreshNow();
    const firstRefresh = mapRefresh.lastRefresh;

    mapRefresh.refreshNow();
    const secondRefresh = mapRefresh.lastRefresh;

    assert.strictEqual(
      mapRefresh.refreshCount,
      2,
      'refreshCount counts every refresh, not just whether one happened'
    );
    assert.notStrictEqual(
      firstRefresh,
      secondRefresh,
      'lastRefresh is replaced with a new Date on every refresh, which is what lets dependents (e.g. the map/nearby/favorites station-request getters) reactively refetch'
    );

    mapRefresh.deactivate(token);
  });

  test('isActive reflects whether any consumer is currently activated', function (assert) {
    const mapRefresh = lookup(this);

    assert.false(mapRefresh.isActive);

    const tokenA = mapRefresh.activate();
    assert.true(mapRefresh.isActive);

    const tokenB = mapRefresh.activate();
    assert.true(mapRefresh.isActive, 'still active with two consumers');

    mapRefresh.deactivate(tokenA);
    assert.true(
      mapRefresh.isActive,
      'still active while the second consumer holds it open'
    );

    mapRefresh.deactivate(tokenB);
    assert.false(
      mapRefresh.isActive,
      'inactive once every consumer has deactivated'
    );
  });
});
