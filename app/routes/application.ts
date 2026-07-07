import Route from '@ember/routing/route';
import { type Registry as Services, service } from '@ember/service';
import { formats } from 'winds-mobi-client-web/ember-intl';
import translationsForEnUs from 'virtual:ember-intl/translations/en-us';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type SessionService from 'winds-mobi-client-web/services/session';

export default class ApplicationRoute extends Route {
  @service declare intl: Services['intl'];
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;
  @service declare session: SessionService;

  override async beforeModel() {
    await super.beforeModel(...arguments);

    // Restores a persisted session (and its JWT) before anything renders.
    await this.session.setup();

    this.intl.addTranslations('en-us', translationsForEnUs);
    this.intl.setFormats(formats);
    this.intl.setLocale(['en-us']);

    await this.nearbyLocation.syncPermissionState();
  }
}
