import Route from '@ember/routing/route';
import { type Registry as Services, service } from '@ember/service';
import { formats } from 'winds-mobi-client-web/ember-intl';
import translationsForEnUs from 'virtual:ember-intl/translations/en-us';

export default class ApplicationRoute extends Route {
  @service declare intl: Services['intl'];

  beforeModel() {
    this.intl.addTranslations('en-us', translationsForEnUs);
    this.intl.setFormats(formats);
    this.intl.setLocale(['en-us']);
  }
}
