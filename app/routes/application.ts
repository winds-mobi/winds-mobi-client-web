import Route from '@ember/routing/route';
import { type Registry as Services, service } from '@ember/service';
import { formats } from 'winds-mobi-client-web/ember-intl';
import translationsForEnUs from 'virtual:ember-intl/translations/en-us';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';

export default class ApplicationRoute extends Route {
  @service declare intl: Services['intl'];
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;

  override async beforeModel() {
    await super.beforeModel(...arguments);

    this.intl.addTranslations('en-us', translationsForEnUs);
    this.intl.setFormats(formats);
    this.intl.setLocale(['en-us']);

    await this.nearbyLocation.syncPermissionState();
  }
}
