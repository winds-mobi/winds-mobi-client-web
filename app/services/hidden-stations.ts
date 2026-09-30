import Service, { service } from '@ember/service';
import { trackedInLocalStorage } from 'ember-tracked-local-storage';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type { Station } from 'winds-mobi-client-web/services/store';

// Station ids the visitor has hidden from the map and the nearby list (#167),
// persisted in the browser via ember-tracked-local-storage, same as
// app/services/favorites.ts. There are no accounts: this list lives on this
// device only.
export default class HiddenStationsService extends Service {
  @service declare settings: SettingsService;

  @trackedInLocalStorage({
    keyName: 'hiddenStations.stationIds',
    defaultValue: [] as string[],
  })
  stationIds!: string[];

  has(stationId: string): boolean {
    return this.stationIds.includes(stationId);
  }

  add(stationId: string): void {
    if (!this.has(stationId)) {
      this.stationIds = [...this.stationIds, stationId];
    }
  }

  remove(stationId: string): void {
    this.stationIds = this.stationIds.filter((id) => id !== stationId);
  }

  // The stations to show: everything but the hidden ones, while hiding is on.
  // Hiding is a beta feature, so turning beta features off shows every
  // station again, whatever this list still holds.
  visible(stations: Station[]): Station[] {
    if (!this.settings.betaFeatureOn('hiddenStationsFeatureEnabled')) {
      return stations;
    }

    return stations.filter((station) => !this.has(station.id));
  }

  toggle(stationId: string): void {
    if (this.has(stationId)) {
      this.remove(stationId);
    } else {
      this.add(stationId);
    }
  }
}

declare module '@ember/service' {
  interface Registry {
    'hidden-stations': HiddenStationsService;
  }
}
