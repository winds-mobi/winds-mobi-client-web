import type RouterService from '@ember/routing/router-service';

// The station whose detail panel is open: the `:station_id` of the
// `map.station` route, the leaf route while a panel is showing.
export function openStationId(router: RouterService): string | undefined {
  const id = router.currentRoute?.params?.['station_id'];

  return typeof id === 'string' ? id : undefined;
}
