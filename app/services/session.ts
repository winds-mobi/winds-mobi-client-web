import BaseSessionService from 'ember-simple-auth/services/session';
import type { SessionAuthenticatedData } from 'winds-mobi-client-web/authenticators/winds-mobi';

export type SessionData = {
  authenticated: SessionAuthenticatedData & { authenticator: string };
};

export default class SessionService extends BaseSessionService<SessionData> {
  // After a successful login (the /auth/callback OTT exchange) land on the
  // map; a transition intercepted by requireAuthentication is retried first.
  override handleAuthentication() {
    super.handleAuthentication('map');
  }
}

declare module '@ember/service' {
  interface Registry {
    session: SessionService;
  }
}
