// TODO: Remove login — NavbarAuth is unmounted (see
// app/components/navbar/index.gts) and backs the disabled sign-in feature
// (see app/services/session.ts). Kept for reference/restoration.
/*
import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, currentRouteName, visit } from '@ember/test-helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import type { Profile } from 'winds-mobi-client-web/services/store';

type FakeStoreRequest = {
  url?: string;
};

const PROFILE_FIXTURE: Profile = {
  id: 'google-123',
  displayName: 'Michal',
  picture: 'https://example.com/avatar.png',
  favorites: ['holfuy-1804'],
  [Type]: 'profile',
};

class FakeStoreService extends Service {
  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    if (url.includes('/user/profile/')) {
      return Promise.resolve({
        content: {
          data: PROFILE_FIXTURE,
        },
      });
    }

    return Promise.resolve({
      content: {
        data: [],
      },
    });
  }
}

module('Acceptance | navbar auth menu', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;
  });

  test('signed out it offers the sign-in providers', async function (assert) {
    await visit('/settings');

    assert.dom('[data-test-navbar-auth]').exists();
    assert.dom('[data-test-navbar-auth-avatar]').doesNotExist();

    await click('[data-test-navbar-auth]');

    assert.dom('[data-test-navbar-auth-item="sign-in-google"]').exists();
    assert.dom('[data-test-navbar-auth-item="sign-in-facebook"]').exists();
    assert.dom('[data-test-navbar-auth-item="sign-out"]').doesNotExist();
  });

  test('signed in it shows the profile and navigates to favourites', async function (assert) {
    await authenticateSession();
    await visit('/settings');

    assert
      .dom('[data-test-navbar-auth-avatar]')
      .hasAttribute('src', PROFILE_FIXTURE.picture!);
    assert.dom('[data-test-navbar-auth-name]').hasText('Michal');

    await click('[data-test-navbar-auth]');

    assert.dom('[data-test-navbar-auth-item="sign-in-google"]').doesNotExist();

    await click('[data-test-navbar-auth-item="favorites"]');

    assert.strictEqual(currentRouteName(), 'favorites');
  });

  test('signed in it signs out from the menu', async function (assert) {
    await authenticateSession();
    await visit('/settings');

    await click('[data-test-navbar-auth]');
    await click('[data-test-navbar-auth-item="sign-out"]');

    assert.false(this.owner.lookup('service:session').isAuthenticated);
    assert.dom('[data-test-navbar-auth-avatar]').doesNotExist();
  });
});
*/
