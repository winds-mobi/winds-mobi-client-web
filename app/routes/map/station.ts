import Route from '@ember/routing/route';

export default class MapStationRoute extends Route {
  model(params: { station_id: string }) {
    return params['station_id'];
  }
}
