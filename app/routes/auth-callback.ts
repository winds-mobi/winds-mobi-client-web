import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type Transition from '@ember/routing/transition';
import type SessionService from 'winds-mobi-client-web/services/session';

export interface AuthCallbackModel {
  failed: boolean;
}

// Landing target of the OAuth flow: winds-mobi-admin redirects here with a
// single-use `?ott=` (30 s TTL). Exchanging it authenticates the session,
// whose handleAuthentication then redirects away; the template only renders
// for the brief pending moment or when the exchange failed.
export default class AuthCallbackRoute extends Route {
  @service declare session: SessionService;

  override async model(transition: Transition): Promise<AuthCallbackModel> {
    const ott = transition.to?.queryParams['ott'];

    if (typeof ott !== 'string' || ott.length === 0) {
      return { failed: true };
    }

    try {
      await this.session.authenticate('authenticator:winds-mobi', ott);

      return { failed: false };
    } catch {
      return { failed: true };
    }
  }
}
