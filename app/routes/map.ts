import Route from '@ember/routing/route';
import type RouteInfo from '@ember/routing/route-info';
import type RouterService from '@ember/routing/router-service';
import type Transition from '@ember/routing/transition';
import { type Registry as Services, service } from '@ember/service';
import {
  isDefaultMapView,
  parseMapView,
  rememberedMapView,
} from 'winds-mobi-client-web/utils/map-view';

// The dynamic segment values of `routeInfo` and its parents, outermost first —
// what `router.replaceWith` takes to reach the same route again.
function dynamicSegments(routeInfo: RouteInfo): string[] {
  const segments: string[] = [];

  for (let route: RouteInfo | null = routeInfo; route; route = route.parent) {
    const { paramNames, params } = route;

    segments.unshift(...paramNames.map((name) => String(params?.[name])));
  }

  return segments;
}

export default class MapRoute extends Route {
  @service declare router: RouterService;
  @service('tracked-local-storage')
  declare trackedLocalStorage: Services['tracked-local-storage'];

  // A cold start onto the map with no view in the URL (`/`, `/map`, or a
  // station's `/map/:station_id`) reopens the last view this browser showed
  // (the map component remembers each routed view). Only the app's first
  // transition does this: once running, the map keeps its view across in-app
  // navigation on its own (Ember's sticky query params), and a bare `/map`
  // reached from inside the app is a deliberate reset (the logo). A restored
  // view isn't the default one, so the map doesn't then jump to the visitor's
  // location either (`modifiers/fly-to-user-location.ts`).
  override beforeModel(transition: Transition) {
    const { to } = transition;

    if (
      transition.from ||
      !to ||
      !isDefaultMapView(parseMapView(to.queryParams))
    ) {
      return;
    }

    const view = rememberedMapView(this.trackedLocalStorage);

    if (view) {
      void this.router.replaceWith(to.name, ...dynamicSegments(to), {
        queryParams: view,
      });
    }
  }
}
