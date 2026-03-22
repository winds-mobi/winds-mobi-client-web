import { pageTitle } from 'ember-page-title';
import { getRequestState } from '@warp-drive/ember';
import Station from 'winds-mobi-client-web/components/station';
import Component from '@glimmer/component';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import type {
  History,
  Station as StationModel,
} from 'winds-mobi-client-web/services/store.js';

interface MapStationTemplateSignature {
  Args: {
    model: unknown;
  };
}

export default class MapStationTemplate extends Component<MapStationTemplateSignature> {
  @service declare router: RouterService;
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;

  get stationId() {
    return this.router.currentRoute?.params['station_id'];
  }

  get stationRequest() {
    return this.store.request(
      findRecord<StationModel>('station', this.stationId as string)
    ) as Promise<{
      data: StationModel;
    }>;
  }

  get historyRequest() {
    return this.store.request(
      historyQuery<History>('history', this.stationId as string)
    ) as Promise<{
      data: History[];
    }>;
  }

  get stationRequestState() {
    return getRequestState(this.stationRequest);
  }

  get historyRequestState() {
    return getRequestState(this.historyRequest);
  }

  get station() {
    return this.stationRequestState.isSuccess
      ? this.stationRequestState.value.data
      : undefined;
  }

  get history() {
    return this.historyRequestState.isSuccess
      ? this.historyRequestState.value.data
      : [];
  }

  <template>
    {{#if this.stationId}}
      {{#if this.station}}
        {{pageTitle this.station.name}}
      {{/if}}

      <Station @station={{this.station}} @history={{this.history}} />
    {{/if}}
  </template>
}
