import { pageTitle } from 'ember-page-title';
import { getRequestState } from '@warp-drive/ember';
import type { Future } from '@warp-drive/core/request';
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

  get stationRequest(): Future<{ data: StationModel }> | undefined {
    if (!this.stationId) {
      return undefined;
    }

    return this.store.request(
      findRecord<StationModel>('station', this.stationId)
    );
  }

  get historyRequest(): Future<{ data: History[] }> | undefined {
    if (!this.stationId) {
      return undefined;
    }

    return this.store.request(historyQuery<History>('history', this.stationId));
  }

  get stationRequestState() {
    return this.stationRequest
      ? getRequestState(this.stationRequest)
      : undefined;
  }

  get historyRequestState() {
    return this.historyRequest
      ? getRequestState(this.historyRequest)
      : undefined;
  }

  get station(): StationModel | undefined {
    return this.stationRequestState?.isSuccess
      ? this.stationRequestState.value.data
      : undefined;
  }

  get history(): History[] {
    return this.historyRequestState?.isSuccess
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
