import Modifier from 'ember-modifier';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import { flyToCoordinates } from 'winds-mobi-client-web/utils/locate';
import {
  currentMapView,
  mapViewsEqual,
  parseMapView,
} from 'winds-mobi-client-web/utils/map-view';

interface FlyToUserLocationSignature {
  Element: Element;
  Args: {
    // Just the "is this environment allowed to auto-fly at all" gate (`Map`
    // passes `config.environment !== 'test'` -- see its own comment). Whether the
    // *routed view itself* is still the default is derived below instead of
    // passed in: unlike `Map`'s own `mapView` getter, this doesn't need
    // `TrackedMapView`'s referential-stability trick (that exists solely to
    // keep a downstream `@cached` consumer -- the station request -- from
    // recomputing across a value-equal transition, see issue #131); a plain
    // value comparison has no such consumer to protect.
    Positional: [enabled: boolean];
  };
}

// Class-based (not the plain `modifier()` helper) specifically to inject `router`
// and `nearby-location` itself -- a function-based modifier has no owner, so it
// can't reach services on its own (see `utils/locate.ts`'s `flyToCoordinates` for
// why that function needs them passed in). `modify()` re-runs whenever any tracked
// state it reads changes, not only its positional args, so reading
// `this.router.currentRoute` and `this.nearbyLocation.coordinates` here is enough
// to react to a real navigation or coordinates arriving -- neither needs to also
// be passed through as an argument.
export default class FlyToUserLocationModifier extends Modifier<FlyToUserLocationSignature> {
  @service declare router: RouterService;
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;

  modify(_element: Element, [enabled]: [boolean]) {
    if (!enabled) {
      return;
    }

    const isInitialDefaultView = mapViewsEqual(
      currentMapView(this.router),
      parseMapView()
    );

    if (isInitialDefaultView && this.nearbyLocation.coordinates) {
      flyToCoordinates(this.router, this.nearbyLocation);
    }
  }
}
