import { module, test } from 'qunit';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

module('Integration | Component | navbar/locate-control', function (hooks) {
  setupRenderingTest(hooks);

  test('it is disabled while permission is still being checked', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    nearbyLocation.permissionState = 'checking';

    await render(hbs`<Navbar::LocateControl />`);

    assert.dom('[data-test-navbar-locate]').isDisabled();
  });

  test('it is enabled once permission is resolved and not mid-request', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    nearbyLocation.permissionState = 'prompt';
    nearbyLocation.requestState = 'idle';

    await render(hbs`<Navbar::LocateControl />`);

    assert.dom('[data-test-navbar-locate]').isNotDisabled();
  });

  test('it is disabled when geolocation is unsupported', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    nearbyLocation.permissionState = 'unsupported';

    await render(hbs`<Navbar::LocateControl />`);

    assert.dom('[data-test-navbar-locate]').isDisabled();
  });

  test('pressing it requests the current position', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    nearbyLocation.permissionState = 'granted';
    let requested = false;

    nearbyLocation.requestCurrentPosition = async () => {
      requested = true;
    };

    await render(hbs`<Navbar::LocateControl />`);
    await click('[data-test-navbar-locate]');

    assert.true(requested);
  });
});
