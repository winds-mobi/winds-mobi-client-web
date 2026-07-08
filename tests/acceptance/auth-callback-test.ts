import Service from '@ember/service';
import { module, test } from 'qunit';
import {
  click,
  currentRouteName,
  currentURL,
  settled,
  visit,
} from '@ember/test-helpers';
import Base from 'ember-simple-auth/authenticators/base';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';

// The auth callback itself never touches the station API, but the shared
// navbar (and the map after the success redirect) does; a no-op store keeps
// those requests from failing.
class FakeStoreService extends Service {
  request() {
    return Promise.resolve({ content: { data: [] } });
  }
}

class SucceedingAuthenticator extends Base {
  override async authenticate() {
    return {
      token: 'a-jwt',
      exp: Math.floor(Date.now() / 1000) + 3600,
      username: 'michal',
    };
  }
}

class FailingAuthenticator extends Base {
  override async authenticate() {
    throw new Error('OTT expired');
  }
}

module('Acceptance | auth callback', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('without an ott it shows the failure card with retry links', async function (assert) {
    await visit('/auth/callback');

    assert.strictEqual(currentURL(), '/auth/callback');
    assert.dom('[data-test-auth-callback-error]').exists();
    assert.dom('[data-test-auth-callback-pending]').doesNotExist();
    assert
      .dom('[data-test-auth-retry="google"]')
      .hasAttribute(
        'href',
        /^https:\/\/winds\.mobi\/user\/google\/oauth2callback\/\?next=.+%2Fauth%2Fcallback$/
      );
    assert
      .dom('[data-test-auth-retry="facebook"]')
      .hasAttribute(
        'href',
        /^https:\/\/winds\.mobi\/user\/facebook\/oauth2callback\/\?next=/
      );
  });

  test('the failure card links back to the map', async function (assert) {
    await visit('/auth/callback');

    await click('[data-test-auth-back-to-map]');

    assert.strictEqual(currentRouteName(), 'map.index');
  });

  test('a failed OTT exchange shows the failure card and stays signed out', async function (assert) {
    this.owner.register('authenticator:winds-mobi', FailingAuthenticator);

    await visit('/auth/callback?ott=expired-ott');

    assert.dom('[data-test-auth-callback-error]').exists();
    assert.false(this.owner.lookup('service:session').isAuthenticated);
  });

  test('a successful OTT exchange signs the user in and redirects to the map', async function (assert) {
    this.owner.register('authenticator:winds-mobi', SucceedingAuthenticator);

    try {
      await visit('/auth/callback?ott=fresh-ott');
    } catch (error) {
      // The success redirect aborts the still-settling /auth/callback
      // transition; the router has already moved on to the map.
      if (!String(error).includes('TransitionAborted')) {
        throw error;
      }

      await settled();
    }

    assert.strictEqual(currentRouteName(), 'map.index');
    assert.true(this.owner.lookup('service:session').isAuthenticated);
  });
});
