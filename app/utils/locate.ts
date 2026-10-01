import type RouterService from '@ember/routing/router-service';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';

// Flies to whatever position `nearbyLocation` currently holds -- a no-op until
// coordinates are known. Takes the service rather than a coordinates value so
// every caller (the map's own geolocate control, and its reactive boot fly-to
// in `modifiers/fly-to-user-location.ts`) shares one read of the same tracked
// state instead of each threading its own local copy through.
export function flyToCoordinates(
  router: RouterService,
  nearbyLocation: NearbyLocationService
): void {
  const { coordinates } = nearbyLocation;

  if (coordinates) {
    void router.replaceWith({ queryParams: focusQueryParamsFor(coordinates) });
  }
}
