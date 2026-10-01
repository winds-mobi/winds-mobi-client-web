import { service } from '@ember/service';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type { Station } from 'winds-mobi-client-web/services/store';
import StationIdListService from 'winds-mobi-client-web/utils/station-id-list';

// Station ids the visitor has hidden (#167).
export default class HiddenStationsService extends StationIdListService {
  readonly storageKey = 'hiddenStations.stationIds';

  @service declare settings: SettingsService;

  // The stations to show: everything but the hidden ones, while hiding is on.
  // Hiding is a beta feature, so turning beta features off shows every
  // station again, whatever this list still holds.
  visible(stations: Station[]): Station[] {
    if (!this.settings.betaFeatureOn('hiddenStationsFeatureEnabled')) {
      return stations;
    }

    return stations.filter((station) => !this.has(station.id));
  }
}

declare module '@ember/service' {
  interface Registry {
    'hidden-stations': HiddenStationsService;
  }
}
