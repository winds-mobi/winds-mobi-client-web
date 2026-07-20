import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { module, test } from 'qunit';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

class FakeMapRefreshService extends Service {
  @tracked isRefreshing = false;
  refreshNowCallCount = 0;

  refreshNow = () => {
    this.refreshNowCallCount++;
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
      .doesNotHaveClass('animate-spin-once-a')
      .doesNotHaveClass('animate-spin-once-b');
  });

  test('each press plays a one-off spin once beta features are enabled, alternating classes so it replays every time', async function (assert) {
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;

    await render(hbs`<Navbar::RefreshControl />`);

    assert
      .dom('[data-test-navbar-refresh] span')
      .doesNotHaveClass('animate-spin-once-a', 'no spin before any press')
      .doesNotHaveClass('animate-spin-once-b', 'no spin before any press');

    await click('[data-test-navbar-refresh]');
    assert
      .dom('[data-test-navbar-refresh] span')
      .hasClass('animate-spin-once-a', 'first press uses the "a" utility');

    await click('[data-test-navbar-refresh]');
    assert
      .dom('[data-test-navbar-refresh] span')
      .hasClass(
        'animate-spin-once-b',
        'second press switches to the "b" utility so the animation-name actually changes and replays'
      );

    await click('[data-test-navbar-refresh]');
    assert
      .dom('[data-test-navbar-refresh] span')
      .hasClass('animate-spin-once-a', 'third press switches back to "a"');
  });

  test('the one-off spin stays off if its own setting is disabled, even with beta features on', async function (assert) {
    const settings = this.owner.lookup('service:settings');
    settings.betaFeaturesEnabled = true;
    settings.refreshButtonSpin = false;

    await render(hbs`<Navbar::RefreshControl />`);
    await click('[data-test-navbar-refresh]');

    assert
      .dom('[data-test-navbar-refresh] span')
      .doesNotHaveClass('animate-spin-once-a')
      .doesNotHaveClass('animate-spin-once-b');
  });
});
