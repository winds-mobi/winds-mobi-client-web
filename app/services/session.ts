// TODO: Remove login — sign-in is currently disabled (unregistered route in
// app/router.ts, no navbar entry point, no session.setup() call). This
// service is kept for reference/restoration but is not actively wired in.
import BaseSessionService from 'ember-simple-auth/services/session';
import type { SessionAuthenticatedData } from 'winds-mobi-client-web/authenticators/winds-mobi';

export type SessionData = {
  authenticated: SessionAuthenticatedData & { authenticator: string };
};

export default class SessionService extends BaseSessionService<SessionData> {
  // The auth-callback route owns the post-login redirect. ESA's default
  // (transition to a fixed route on every authenticationSucceeded) would
  // also fire for cross-tab session sync and for test-helper logins that
  // happen before routing starts — neither should move the current route.
  override handleAuthentication() {}
}

declare module '@ember/service' {
  interface Registry {
    session: SessionService;
  }
}
