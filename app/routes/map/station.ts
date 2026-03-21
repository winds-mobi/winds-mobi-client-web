import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import type { History, Station } from 'winds-mobi-client-web/services/store.js';

export interface MapStationRouteModel {
  historyRequest: Promise<{
    data: History[];
  }>;
  stationRequest: Promise<{
    data: Station;
  }>;
}

export default class MapStationRoute extends Route {
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;

  model(params: { station_id: string }): MapStationRouteModel {
    const stationId = params['station_id'];
    const stationRequest = this.store.request(
      findRecord<Station>('station', stationId)
    ) as Promise<{
      data: Station;
    }>;
    const historyRequest = this.store.request(
      historyQuery<History>('history', stationId)
    ) as Promise<{
      data: History[];
    }>;

    return {
      stationRequest,
      historyRequest,
    };
  }
}
