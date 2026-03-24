import { pageTitle } from 'ember-page-title';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import Station from 'winds-mobi-client-web/components/station';
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type {
  History,
  Station as StationModel,
} from 'winds-mobi-client-web/services/store.js';

interface MapStationTemplateSignature {
  Args: {
    model: unknown;
  };
}

type RequestStore = {
  request<T>(request: unknown): Future<T>;
};

export default class MapStationTemplate extends Component<MapStationTemplateSignature> {
  @service declare router: RouterService;
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;
  @service declare mapRefresh: MapRefreshService;

  get stationId() {
    return this.router.currentRoute?.params['station_id'];
  }

  private get requestStore(): RequestStore {
    return this.store as unknown as RequestStore;
  }

  @cached
  get stationRequest(): Future<{ data: StationModel }> | undefined {
    if (!this.stationId) {
      return undefined;
    }

    this.mapRefresh.lastRefresh;

    return this.requestStore.request<{ data: StationModel }>(
      findRecord<StationModel>('station', this.stationId, undefined, {
        backgroundReload: true,
      })
    );
  }

  @cached
  get historyRequest(): Future<{ data: History[] }> | undefined {
    if (!this.stationId) {
      return undefined;
    }

    this.mapRefresh.lastRefresh;

    return this.requestStore.request<{ data: History[] }>(
      historyQuery<History>('history', this.stationId, undefined, {
        backgroundReload: true,
      })
    );
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
