// TODO: Remove login — this authenticator backs the disabled sign-in
// feature (see app/services/session.ts). Kept for reference/restoration.
/*
import { module, test } from 'qunit';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import type WindsMobiAuthenticator from 'winds-mobi-client-web/authenticators/winds-mobi';
import {
  getAuthToken,
  setAuthToken,
} from 'winds-mobi-client-web/utils/auth-token';

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeToken(payload: object): string {
  return `header.${base64Url(JSON.stringify(payload))}.signature`;
}

function futureExp(): number {
  return Math.floor(Date.now() / 1000) + 3600;
}

module('Unit | Authenticator | winds-mobi', function (hooks) {
  setupTest(hooks);

  hooks.afterEach(function () {
    setAuthToken(null);
  });

  function lookupAuthenticator(context: {
    owner: { lookup(name: string): unknown };
  }) {
    return context.owner.lookup(
      'authenticator:winds-mobi'
    ) as WindsMobiAuthenticator;
  }

  test('authenticate exchanges the OTT for a JWT session', async function (assert) {
    const exp = futureExp();
    const token = makeToken({ username: 'michal', exp });
    const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      calls.push({ input, init });

      return new Response(JSON.stringify({ token }), { status: 200 });
    }) as typeof fetch;

    try {
      const data = await lookupAuthenticator(this).authenticate('fresh-ott');

      assert.deepEqual(data, { token, exp, username: 'michal' });
      assert.strictEqual(
        getAuthToken(),
        token,
        'the token is published for the request layer'
      );
      assert.strictEqual(calls[0]?.input, 'https://winds.mobi/user/login/');
      assert.strictEqual(calls[0]?.init?.method, 'POST');
      assert.strictEqual(
        calls[0]?.init?.body,
        JSON.stringify({ ott: 'fresh-ott' })
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('authenticate rejects when the exchange fails', async function (assert) {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response('nope', { status: 403 })) as typeof fetch;

    try {
      await assert.rejects(
        lookupAuthenticator(this).authenticate('stale-ott'),
        /Login failed with status 403/
      );
      assert.strictEqual(getAuthToken(), null);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('authenticate rejects a token missing the expected claims', async function (assert) {
    const token = makeToken({ exp: futureExp() });
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ token }), { status: 200 })) as typeof fetch;

    try {
      await assert.rejects(
        lookupAuthenticator(this).authenticate('fresh-ott'),
        /invalid token/
      );
      assert.strictEqual(getAuthToken(), null);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('restore keeps a fresh session and republishes its token', async function (assert) {
    const data = { token: 'a-jwt', exp: futureExp(), username: 'michal' };

    assert.deepEqual(await lookupAuthenticator(this).restore(data), data);
    assert.strictEqual(getAuthToken(), 'a-jwt');
  });

  test('restore rejects an expired session and clears the token', async function (assert) {
    setAuthToken('a-jwt');

    await assert.rejects(
      lookupAuthenticator(this).restore({
        token: 'a-jwt',
        exp: Math.floor(Date.now() / 1000) - 60,
        username: 'michal',
      }),
      /expired/
    );
    assert.strictEqual(getAuthToken(), null);
  });

  test('invalidate clears the published token', async function (assert) {
    setAuthToken('a-jwt');

    await lookupAuthenticator(this).invalidate();

    assert.strictEqual(getAuthToken(), null);
  });
});
*/
