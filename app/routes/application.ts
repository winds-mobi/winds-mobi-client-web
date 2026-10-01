import Route from '@ember/routing/route';
import { type Registry as Services, service } from '@ember/service';
import { formats } from 'winds-mobi-client-web/ember-intl';
import translationsForEnUs from 'virtual:ember-intl/translations/en-us';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import { removeRetiredStorageKeys } from 'winds-mobi-client-web/utils/retired-storage-keys';
import type Transition from '@ember/routing/transition';

export default class ApplicationRoute extends Route {
  @service declare intl: Services['intl'];
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;
  @service('tracked-local-storage')
  declare trackedLocalStorage: Services['tracked-local-storage'];

  override async beforeModel(transition: Transition) {
    await super.beforeModel(transition);

    removeRetiredStorageKeys(this.trackedLocalStorage);

    this.intl.addTranslations('en-us', translationsForEnUs);
    this.intl.setFormats(formats);
    this.intl.setLocale(['en-us']);

    // Not awaited: every consumer derives from the service's tracked
    // `coordinates`, and awaiting would hold the whole app behind a cold GPS
    // fix -- up to the 15s timeout in utils/location.ts -- before anything
    // renders.
    void this.nearbyLocation.locateIfPermitted();
  }
}
