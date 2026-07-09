import { module, test } from 'qunit';
import { find, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

module('Integration | Component | auth/sign-in-links', function (hooks) {
  setupRenderingTest(hooks);

  test('it links to the google and facebook oauth callbacks with a next redirect back to this app', async function (assert) {
    await render(hbs`<Auth::SignInLinks />`);

    const googleHref =
      find('[data-test-auth-sign-in="google"]')?.getAttribute('href') ?? '';
    const googleUrl = new URL(googleHref);

    assert.strictEqual(googleUrl.origin, 'https://winds.mobi');
    assert.strictEqual(googleUrl.pathname, '/user/google/oauth2callback/');
    assert.strictEqual(
      googleUrl.searchParams.get('next'),
      `${window.location.origin}/auth/callback`
    );

    const facebookHref =
      find('[data-test-auth-sign-in="facebook"]')?.getAttribute('href') ?? '';
    assert.true(
      facebookHref.includes('/user/facebook/oauth2callback/'),
      'the facebook link points at the facebook oauth callback'
    );
  });
});
