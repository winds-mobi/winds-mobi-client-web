import Service from '@ember/service';
import { trackedInLocalStorage } from 'ember-tracked-local-storage';

// A device-local list of station ids (favourites, hidden stations), persisted
// in the browser via ember-tracked-local-storage under the subclass's own
// `storageKey`. There are no accounts: these lists live on this device only.
export default abstract class StationIdListService extends Service {
  abstract readonly storageKey: string;

  @trackedInLocalStorage({ keyNameProperty: 'storageKey', defaultValue: [] })
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

  toggle(stationId: string): void {
    if (this.has(stationId)) {
      this.remove(stationId);
    } else {
      this.add(stationId);
    }
  }
}
