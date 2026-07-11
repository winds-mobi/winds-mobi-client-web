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
});
