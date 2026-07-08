// The user/auth API lives in winds-mobi-admin (Django), served under
// https://winds.mobi/user/ — a separate service from the station API
// configured via setBuildURLConfig in app/app.ts.
const USER_API_HOST = 'https://winds.mobi';
// const USER_API_HOST = 'http://localhost:8006'; // dev override

export function userApiUrl(path: string): string {
  return `${USER_API_HOST}/user/${path}`;
}

export type SignInProvider = 'facebook' | 'google';

// Full-page navigation target that starts the OAuth flow. The backend
// validates `next` against an origin allowlist, completes the provider
// round-trip, and redirects back to `next` with a single-use `?ott=` that
// the auth-callback route exchanges for a JWT at /user/login/.
export function signInUrl(provider: SignInProvider): string {
  const next = `${window.location.origin}/auth/callback`;

  return userApiUrl(
    `${provider}/oauth2callback/?next=${encodeURIComponent(next)}`
  );
}
