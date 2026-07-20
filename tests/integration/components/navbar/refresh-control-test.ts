import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { module, test } from 'qunit';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

class FakeMapRefreshService extends Service {
  @tracked isRefreshing = false;
  @tracked refreshCount = 0;
  refreshNowCallCount = 0;

  // Mirrors the real service: every refresh, from any trigger, bumps
  // `refreshCount`.
  refreshNow = () => {
    this.refreshNowCallCount++;
    this.refreshCount++;
  };
}

module('Integration | Component | navbar/refresh-control', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:map-refresh', FakeMapRefreshService);
  });

  test('it spins while a refresh is in flight and is idle otherwise', async function (assert) {
    const mapRefresh = this.owner.lookup(
      'service:map-refresh'
    ) as unknown as FakeMapRefreshService;

    await render(hbs`<Navbar::RefreshControl />`);

    assert.dom('svg').doesNotHaveClass('animate-spin');

    mapRefresh.isRefreshing = true;
    await render(hbs`<Navbar::RefreshControl />`);

    assert.dom('svg').hasClass('animate-spin');
  });

  test('pressing the button triggers a refresh', async function (assert) {
    const mapRefresh = this.owner.lookup(
      'service:map-refresh'
    ) as unknown as FakeMapRefreshService;

    await render(hbs`<Navbar::RefreshControl />`);
    await click('[data-test-navbar-refresh]');

    assert.strictEqual(mapRefresh.refreshNowCallCount, 1);
  });

  test('the one-off spin is off by default (beta features are off)', async function (assert) {
    await render(hbs`<Navbar::RefreshControl />`);

    await click('[data-test-navbar-refresh]');

    assert
      .dom('[data-test-navbar-refresh] span')
      .hasAttribute('style', /rotate\(0deg\)/);
  });

  test('each refresh adds a full turn once beta features are enabled, so the transition replays every time', async function (assert) {
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;

    await render(hbs`<Navbar::RefreshControl />`);

    assert
      .dom('[data-test-navbar-refresh] span')
      .hasAttribute(
        'style',
        /rotate\(0deg\)/,
        'no rotation before any refresh'
      );

    await click('[data-test-navbar-refresh]');
    assert
      .dom('[data-test-navbar-refresh] span')
      .hasAttribute('style', /rotate\(360deg\)/, 'first press adds one turn');

    await click('[data-test-navbar-refresh]');
    assert
      .dom('[data-test-navbar-refresh] span')
      .hasAttribute(
        'style',
        /rotate\(720deg\)/,
        'second press adds another turn -- always forward, never resetting back to 0'
      );

    await click('[data-test-navbar-refresh]');
    assert
      .dom('[data-test-navbar-refresh] span')
      .hasAttribute(
        'style',
        /rotate\(1080deg\)/,
        'third press adds a third turn'
      );
  });

  test('a refresh triggered from elsewhere (e.g. the auto-refresh tick) spins the icon too, not just a button press', async function (assert) {
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;

    const refreshService = this.owner.lookup(
      'service:map-refresh'
    ) as unknown as FakeMapRefreshService;

    await render(hbs`<Navbar::RefreshControl />`);

    // Simulate the auto-refresh loop firing on its own, with no click.
    refreshService.refreshCount++;
    await render(hbs`<Navbar::RefreshControl />`);

    assert
      .dom('[data-test-navbar-refresh] span')
      .hasAttribute(
        'style',
        /rotate\(360deg\)/,
        'a non-click refresh start still plays the one-off spin'
      );
  });

  test('the one-off spin stays off if its own setting is disabled, even with beta features on', async function (assert) {
    const settings = this.owner.lookup('service:settings');
    settings.betaFeaturesEnabled = true;
    settings.refreshButtonSpin = false;

    await render(hbs`<Navbar::RefreshControl />`);
    await click('[data-test-navbar-refresh]');

    assert
      .dom('[data-test-navbar-refresh] span')
      .hasAttribute('style', /rotate\(0deg\)/);
  });
});
