import StationIdListService from 'winds-mobi-client-web/utils/station-id-list';

export default class FavoritesService extends StationIdListService {
  readonly storageKey = 'favorites.stationIds';
}

declare module '@ember/service' {
  interface Registry {
    favorites: FavoritesService;
  }
}
