export type StationTab = 'summary' | 'winds' | 'air';

export type StationRouteName =
  | 'map.station.summary'
  | 'map.station.winds'
  | 'map.station.air';

export function stationTabFromRouteName(
  routeName: string | undefined
): StationTab {
  switch (routeName) {
    case 'map.station.winds':
      return 'winds';
    case 'map.station.air':
      return 'air';
    default:
      return 'summary';
  }
}

export function stationRouteNameForTab(tab: StationTab): StationRouteName {
  switch (tab) {
    case 'winds':
      return 'map.station.winds';
    case 'air':
      return 'map.station.air';
    default:
      return 'map.station.summary';
  }
}
