import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { module, test } from 'qunit';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

class FakeMapRefreshService extends Service {
  @tracked isRefreshing = false;
  @tracked refreshCount = 0;
  @tracked elapsedMs = 0;
  refreshIntervalMs = 120_000;
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

    assert
      .dom('[data-test-navbar-refresh] span svg')
      .doesNotHaveClass('animate-spin');

    mapRefresh.isRefreshing = true;
    await render(hbs`<Navbar::RefreshControl />`);

    assert.dom('[data-test-navbar-refresh] span svg').hasClass('animate-spin');
  });

  test('pressing the button triggers a refresh', async function (assert) {
    const mapRefresh = this.owner.lookup(
      'service:map-refresh'
    ) as unknown as FakeMapRefreshService;

    await render(hbs`<Navbar::RefreshControl />`);
    await click('[data-test-navbar-refresh]');

    assert.strictEqual(mapRefresh.refreshNowCallCount, 1);
  });

  test('each refresh adds a full turn, so the transition replays every time', async function (assert) {
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

  test('the ring shows how far through the refresh interval the last refresh is', async function (assert) {
    const mapRefresh = this.owner.lookup(
      'service:map-refresh'
    ) as unknown as FakeMapRefreshService;
    const circumference = 2 * Math.PI * 20;

    await render(hbs`<Navbar::RefreshControl />`);

    assert
      .dom('[data-test-navbar-refresh-progress]')
      .hasAttribute(
        'style',
        new RegExp(`stroke-dashoffset: ${circumference}px`),
        'empty ring right after a refresh'
      );

    mapRefresh.elapsedMs = mapRefresh.refreshIntervalMs / 2;
    await render(hbs`<Navbar::RefreshControl />`);

    assert
      .dom('[data-test-navbar-refresh-progress]')
      .hasAttribute(
        'style',
        new RegExp(`stroke-dashoffset: ${circumference / 2}px`),
        'half-full halfway to the next automatic refresh'
      );

    // Clamped, not overshot, however far a test double's elapsed time drifts.
    mapRefresh.elapsedMs = mapRefresh.refreshIntervalMs * 10;
    await render(hbs`<Navbar::RefreshControl />`);

    assert
      .dom('[data-test-navbar-refresh-progress]')
      .hasAttribute('style', /stroke-dashoffset: 0px/, 'full, never negative');
  });
});
