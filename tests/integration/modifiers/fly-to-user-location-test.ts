import { module, test } from 'qunit';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { set } from '@ember/object';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type RouterService from '@ember/routing/router-service';

function stubReplaceWith(router: RouterService) {
  const calls: unknown[] = [];

  router.replaceWith = ((...args: unknown[]) => {
    calls.push(args[0]);
    return Promise.resolve();
  }) as unknown as RouterService['replaceWith'];

  return calls;
}

function stubCurrentRouteQueryParams(
  router: RouterService,
  queryParams: Record<string, string>
) {
  Object.defineProperty(router, 'currentRoute', {
    value: { queryParams },
    configurable: true,
  });
}

// Regression coverage for the bug this modifier fixes: `ApplicationRoute#beforeModel`
// no longer awaits `nearbyLocation.syncPermissionState()` before render (see
// TODO.md item 2), so for an already-granted returning user, `coordinates` on the
// `nearby-location` service typically resolve *after* this modifier's host element
// has already mounted. The modifier must react to that late arrival, not just check
// once at setup.
module('Integration | Modifier | fly-to-user-location', function (hooks) {
  setupRenderingTest(hooks);

  test('it flies to coordinates that are already present, when enabled and on the default view', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    const router = this.owner.lookup('service:router');
    const calls = stubReplaceWith(router);

    stubCurrentRouteQueryParams(router, {});
    nearbyLocation.coordinates = {
      accuracy: 10,
      latitude: 46.521,
      longitude: 6.632,
    };
    set(this, 'enabled', true);

    await render(hbs`<div {{fly-to-user-location this.enabled}}></div>`);

    assert.strictEqual(calls.length, 1);
    assert.deepEqual(calls[0], {
      queryParams: { latitude: 46.521, longitude: 6.632, zoom: 10 },
    });
  });

  test('it does not fly when disabled', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    const router = this.owner.lookup('service:router');
    const calls = stubReplaceWith(router);

    stubCurrentRouteQueryParams(router, {});
    nearbyLocation.coordinates = {
      accuracy: 10,
      latitude: 46.521,
      longitude: 6.632,
    };
    set(this, 'enabled', false);

    await render(hbs`<div {{fly-to-user-location this.enabled}}></div>`);

    assert.strictEqual(calls.length, 0);
  });

  test('it does not fly while there are no coordinates yet', async function (assert) {
    const router = this.owner.lookup('service:router');
    const calls = stubReplaceWith(router);

    stubCurrentRouteQueryParams(router, {});
    set(this, 'enabled', true);

    await render(hbs`<div {{fly-to-user-location this.enabled}}></div>`);

    assert.strictEqual(calls.length, 0);
  });

  test('it does not fly when the routed view is not the default anymore', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    const router = this.owner.lookup('service:router');
    const calls = stubReplaceWith(router);

    stubCurrentRouteQueryParams(router, {
      latitude: '10',
      longitude: '20',
      zoom: '5',
    });
    nearbyLocation.coordinates = {
      accuracy: 10,
      latitude: 46.521,
      longitude: 6.632,
    };
    set(this, 'enabled', true);

    await render(hbs`<div {{fly-to-user-location this.enabled}}></div>`);

    assert.strictEqual(calls.length, 0);
  });

  test('it flies once coordinates arrive after the initial render', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    const router = this.owner.lookup('service:router');
    const calls = stubReplaceWith(router);

    stubCurrentRouteQueryParams(router, {});
    set(this, 'enabled', true);

    await render(hbs`<div {{fly-to-user-location this.enabled}}></div>`);

    assert.strictEqual(calls.length, 0, 'nothing yet -- coordinates unknown');

    nearbyLocation.coordinates = {
      accuracy: 10,
      latitude: 46.521,
      longitude: 6.632,
    };
    await settled();

    assert.strictEqual(
      calls.length,
      1,
      'flies once coordinates resolve later, matching a granted-but-not-yet-fixed boot'
    );
  });
});
