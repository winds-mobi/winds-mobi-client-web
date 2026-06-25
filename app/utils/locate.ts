import type RouterService from '@ember/routing/router-service';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';

export async function requestAndFly(
  nearbyLocation: NearbyLocationService,
  router: RouterService
): Promise<void> {
  await nearbyLocation.requestCurrentPosition();

  const { coordinates } = nearbyLocation;

  if (coordinates && router.currentRouteName?.startsWith('map')) {
    void router.replaceWith({ queryParams: focusQueryParamsFor(coordinates) });
  }
}
