import type { Registry as Services } from '@ember/service';

// The last URL the app showed (route, dynamic segments and query params), kept
// in this browser so opening the app at its root — a new tab, a home-screen
// shortcut, or a mobile browser that dropped the app from memory — reopens
// exactly where the visitor left off.
const LAST_URL_KEY = 'app.lastUrl';

export function rememberUrl(
  storage: Services['tracked-local-storage'],
  url: string
): void {
  storage.setItem(LAST_URL_KEY, url);
}

// The root itself is never handed back: the index route redirects away from
// it, so reopening `/` would only redirect to itself again.
export function rememberedUrl(
  storage: Services['tracked-local-storage']
): string | undefined {
  const url = storage.getItem(LAST_URL_KEY);

  return typeof url === 'string' && url.startsWith('/') && url !== '/'
    ? url
    : undefined;
}
