import Route from '@ember/routing/route';
import type RouterService from '@ember/routing/router-service';
import type Transition from '@ember/routing/transition';
import { type Registry as Services, service } from '@ember/service';
import { rememberedUrl } from 'winds-mobi-client-web/utils/last-url';

export default class IndexRoute extends Route {
  @service declare router: RouterService;
  @service('tracked-local-storage')
  declare trackedLocalStorage: Services['tracked-local-storage'];

  // Opening the app at its root reopens the last URL this browser showed
  // (`modifiers/remember-url.ts`), falling back to the map. Only on the app's
  // first transition: any explicit URL, `/map` included, opens as asked.
  beforeModel(transition: Transition) {
    const url = transition.from
      ? undefined
      : rememberedUrl(this.trackedLocalStorage);

    if (url) {
      this.router.transitionTo(url);
    } else {
      this.router.transitionTo('map');
    }
  }
}
