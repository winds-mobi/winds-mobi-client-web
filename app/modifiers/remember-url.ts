import Modifier from 'ember-modifier';
import { type Registry as Services, service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { rememberUrl } from 'winds-mobi-client-web/utils/last-url';

interface RememberUrlSignature {
  Element: Element;
}

// Stores the current URL for `routes/index.ts` to reopen on the next cold
// start. `modify()` runs on install — after the app's first transition, which
// a `routeDidChange` listener attached at render would miss — and again
// whenever `router.currentURL`, which it reads, changes. Class-based so it can
// inject the router and storage itself.
export default class RememberUrlModifier extends Modifier<RememberUrlSignature> {
  @service declare router: RouterService;
  @service('tracked-local-storage')
  declare trackedLocalStorage: Services['tracked-local-storage'];

  modify() {
    const url = this.router.currentURL;

    if (url) {
      rememberUrl(this.trackedLocalStorage, url);
    }
  }
}
