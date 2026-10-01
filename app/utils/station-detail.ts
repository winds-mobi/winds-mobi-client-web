import type RouterService from '@ember/routing/router-service';

// The `station` query param every surface (all, favourites, hidden) declares
// identically -- see each controller. Reading it directly off the current
// route, the same way `currentMapView` in map-view.ts reads the camera, lets
// every surface check "which station is open" without a route param or a
// dedicated service: opening one never changes which page you're on.
export function currentStationDetailId(
  router: RouterService
): string | undefined {
  const raw = router.currentRoute?.queryParams['station'];

  return typeof raw === 'string' ? raw : undefined;
}
