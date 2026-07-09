import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

// The link's query-param reset-to-default behaviour needs a full app boot to
// resolve the map controller's queryParams (a bare rendering test renders a
// bare `/map` href with no query string at all) — see the acceptance test
// "it resets to the default view when the logo is clicked" in
// map-query-params-test.ts for that coverage.
module('Integration | Component | navbar/logo', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the app name and logo image', async function (assert) {
    await render(hbs`<Navbar::Logo />`);

    assert.dom('[data-test-navbar-logo] img').hasAttribute('src', '/logo.svg');
    assert.dom('[data-test-navbar-logo] img').hasAttribute('alt', 'winds.mobi');
    assert.dom('[data-test-navbar-logo]').includesText('winds.mobi');
  });
});
