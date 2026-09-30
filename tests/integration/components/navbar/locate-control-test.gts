import { module, test } from 'qunit';
import { click, render } from '@ember/test-helpers';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import NavbarLocateControl from 'winds-mobi-client-web/components/navbar/locate-control';

module('Integration | Component | navbar/locate-control', function (hooks) {
  setupRenderingTest(hooks);

  test('it is disabled while permission is still being checked', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    nearbyLocation.permissionState = 'checking';

    await render(<template><NavbarLocateControl /></template>);

    assert.dom('[data-test-navbar-locate]').isDisabled();
  });

  test('it is enabled once permission is resolved and not mid-request', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    nearbyLocation.permissionState = 'prompt';
    nearbyLocation.requestState = 'idle';

    await render(<template><NavbarLocateControl /></template>);

    assert.dom('[data-test-navbar-locate]').isNotDisabled();
  });

  test('it is disabled when geolocation is unsupported', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    nearbyLocation.permissionState = 'unsupported';

    await render(<template><NavbarLocateControl /></template>);

    assert.dom('[data-test-navbar-locate]').isDisabled();
  });

  test('pressing it requests the current position', async function (assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    nearbyLocation.permissionState = 'granted';
    let requested = false;

    nearbyLocation.requestCurrentPosition = () => {
      requested = true;
      return Promise.resolve();
    };

    await render(<template><NavbarLocateControl /></template>);
    await click('[data-test-navbar-locate]');

    assert.true(requested);
  });
});
