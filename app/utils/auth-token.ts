// Module-scope mirror of the session's JWT for the Warp Drive request layer:
// handlers are registered at module scope in app/services/store.ts and have
// no service injection, so they can't read the ember-simple-auth session
// directly. The authenticator keeps this in sync across authenticate/restore/
// invalidate; reactive auth state for the UI stays on the session service.
let currentToken: string | null = null;

export function getAuthToken(): string | null {
  return currentToken;
}

export function setAuthToken(token: string | null): void {
  currentToken = token;
}
