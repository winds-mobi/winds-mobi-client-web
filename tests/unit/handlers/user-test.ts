import { module, test } from 'qunit';
import UserHandler from 'winds-mobi-client-web/handlers/user';
import { setAuthToken } from 'winds-mobi-client-web/utils/auth-token';

const PROFILE_URL = 'https://winds.mobi/user/profile/';

interface ProfileDocument {
  links: { self: string };
  data: {
    type: string;
    id: string;
    attributes: Record<string, unknown>;
  };
}

module('Unit | Handler | user', function (hooks) {
  hooks.afterEach(function () {
    setAuthToken(null);
  });

  test('it passes non-user-API requests through untouched', async function (assert) {
    setAuthToken('secret-token');

    const upstream = { content: { data: [] } };
    let forwarded: { headers?: Headers } | undefined;

    const response = await UserHandler.request(
      {
        request: {
          url: 'https://winds.mobi/api/2.3/stations/?limit=8',
        },
      } as never,
      async (request) => {
        forwarded = request as never;

        return upstream as never;
      }
    );

    assert.strictEqual(response, upstream);
    assert.strictEqual(
      new Headers(forwarded?.headers).get('authorization'),
      null,
      'no session token leaks to the station API'
    );
  });

  test('it injects the session JWT into user-API requests', async function (assert) {
    setAuthToken('secret-token');

    const upstream = { content: null };
    let forwarded: { headers?: Headers } | undefined;

    const response = await UserHandler.request(
      {
        request: {
          url: 'https://winds.mobi/user/profile/favorites/holfuy-1850/',
          method: 'POST',
        },
      } as never,
      async (request) => {
        forwarded = request as never;

        return upstream as never;
      }
    );

    assert.strictEqual(
      new Headers(forwarded?.headers).get('authorization'),
      'JWT secret-token'
    );
    assert.strictEqual(
      response,
      upstream,
      'favorites mutations pass through unreshaped'
    );
  });

  test('it sends no authorization header while signed out', async function (assert) {
    let forwarded: { headers?: Headers } | undefined;

    await UserHandler.request(
      {
        request: {
          url: 'https://winds.mobi/user/profile/favorites/holfuy-1850/',
          method: 'DELETE',
        },
      } as never,
      async (request) => {
        forwarded = request as never;

        return { content: null } as never;
      }
    );

    assert.false(new Headers(forwarded?.headers).has('authorization'));
  });

  test('it reshapes the profile read into JSON:API', async function (assert) {
    const response = await UserHandler.request<ProfileDocument>(
      {
        request: {
          url: PROFILE_URL,
          method: 'GET',
        },
      } as never,
      async () =>
        ({
          content: {
            _id: 'user-1',
            favorites: ['holfuy-1850', 'jdc-1001'],
            picture: 'https://example.com/me.jpg',
            'display-name': 'Michal',
          },
        }) as never
    );

    assert.deepEqual(response, {
      links: { self: PROFILE_URL },
      data: {
        type: 'profile',
        id: 'user-1',
        attributes: {
          favorites: ['holfuy-1850', 'jdc-1001'],
          picture: 'https://example.com/me.jpg',
          displayName: 'Michal',
        },
      },
    });
  });

  test('it defaults favorites and omits absent optional profile attributes', async function (assert) {
    const response = await UserHandler.request<ProfileDocument>(
      {
        request: {
          url: PROFILE_URL,
          method: 'GET',
        },
      } as never,
      async () => ({ content: { _id: 'user-1' } }) as never
    );

    assert.deepEqual(response.data.attributes, { favorites: [] });
    assert.false('picture' in response.data.attributes);
    assert.false('displayName' in response.data.attributes);
  });
});
