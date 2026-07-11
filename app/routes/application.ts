import Route from '@ember/routing/route';
import { type Registry as Services, service } from '@ember/service';
import { formats } from 'winds-mobi-client-web/ember-intl';
import translationsForEnUs from 'virtual:ember-intl/translations/en-us';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type Transition from '@ember/routing/transition';
// TODO: Remove login — SessionService backs the disabled sign-in feature
// (see app/services/session.ts). Restore this import alongside it.
// import type SessionService from 'winds-mobi-client-web/services/session';

export default class ApplicationRoute extends Route {
  @service declare intl: Services['intl'];
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;
  // TODO: Remove login — session service injection, paired with the setup()
  // call below.
  // @service declare session: SessionService;

  override async beforeModel(transition: Transition) {
    await super.beforeModel(transition);

    // TODO: Remove login — restores a persisted session (and its JWT)
    // before anything renders.
    // await this.session.setup();

    this.intl.addTranslations('en-us', translationsForEnUs);
    this.intl.setFormats(formats);
    this.intl.setLocale(['en-us']);

    await this.nearbyLocation.syncPermissionState();
  }
}
