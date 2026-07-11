// TODO: Remove login — backs the disabled sign-in feature (see
// app/services/session.ts). Kept for reference/restoration.
import Base from 'ember-simple-auth/authenticators/base';
import { setAuthToken } from 'winds-mobi-client-web/utils/auth-token';
import { decodeJwtPayload } from 'winds-mobi-client-web/utils/jwt';
import { userApiUrl } from 'winds-mobi-client-web/utils/user-api';

export interface SessionAuthenticatedData {
  token: string;
  exp: number;
  username: string;
}

function isFreshToken(data: SessionAuthenticatedData): boolean {
  return typeof data.token === 'string' && data.exp * 1000 > Date.now();
}

// Exchanges the single-use OTT (`?ott=` on /auth/callback, minted by the
// winds-mobi-admin OAuth callback, 30 s TTL) for a 30-day JWT.
//
// The token exchange uses fetch() directly — a deliberate exception to the
// "all requests go through Warp Drive" architecture: it is auth plumbing,
// not resource data, and must stay out of the store's cache.
export default class WindsMobiAuthenticator extends Base {
  override async authenticate(ott: string): Promise<SessionAuthenticatedData> {
    const response = await fetch(userApiUrl('login/'), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ott }),
    });

    if (!response.ok) {
      throw new Error(`Login failed with status ${response.status}`);
    }

    const { token } = (await response.json()) as { token: string };
    const payload = decodeJwtPayload(token);

    if (
      typeof payload?.exp !== 'number' ||
      typeof payload.username !== 'string'
    ) {
      throw new Error('Login returned an invalid token');
    }

    setAuthToken(token);

    return { token, exp: payload.exp, username: payload.username };
  }

  override restore(
    data: SessionAuthenticatedData
  ): Promise<SessionAuthenticatedData> {
    if (!isFreshToken(data)) {
      setAuthToken(null);
      return Promise.reject(new Error('Session has expired'));
    }

    setAuthToken(data.token);

    return Promise.resolve(data);
  }

  override invalidate(): Promise<void> {
    setAuthToken(null);
    return Promise.resolve();
  }
}
