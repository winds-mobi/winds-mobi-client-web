import Service from '@ember/service';
import { trackedInLocalStorage } from 'ember-tracked-local-storage';

// Favourite station ids, persisted directly in the browser via
// ember-tracked-local-storage (see app/services/settings.ts for the same
// pattern). No account/profile backs this list — sign-in is currently
// disabled (see app/services/session.ts), so favourites are device-local.
export default class FavoritesService extends Service {
  @trackedInLocalStorage({
    keyName: 'favorites.stationIds',
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
    favorites: FavoritesService;
  }
}
