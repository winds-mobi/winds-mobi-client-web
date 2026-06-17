import { pageTitle } from 'ember-page-title';
import { getRequestState } from '@warp-drive/core/reactive';
import Station from 'winds-mobi-client-web/components/station';
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import { stationFaviconDataUri } from 'winds-mobi-client-web/utils/station-favicon';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type { Station as StationModel } from 'winds-mobi-client-web/services/store.js';

interface MapStationTemplateSignature {
  Args: {
    model: unknown;
  };
}

export default class MapStationTemplate extends Component<MapStationTemplateSignature> {
  @service declare router: RouterService;
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;
  @service declare mapRefresh: MapRefreshService;

  get stationId() {
    return this.router.currentRoute?.params['station_id'];
  }

  @cached
  get stationRequest(): Future<{ data: StationModel }> | undefined {
    if (!this.stationId) {
      return undefined;
    }

    this.mapRefresh.lastRefresh;

    return this.store.request<{ data: StationModel }>(
      findRecord<StationModel>('station', this.stationId, undefined, {
        backgroundReload: true,
      })
    );
  }

  get stationRequestState() {
    return this.stationRequest
      ? getRequestState(this.stationRequest)
      : undefined;
  }

  get station(): StationModel | undefined {
    return this.stationRequestState?.isSuccess
      ? this.stationRequestState.value.data
      : undefined;
  }

  get faviconDataUri(): string | undefined {
    return this.station ? stationFaviconDataUri(this.station) : undefined;
  }

  // `{{in-element}}` destination for the dynamic favicon. While a station is
  // open this renders the only explicit `<link rel="icon">`, so the browser
  // uses it; Glimmer removes it when the panel tears down, falling back to the
  // static `/favicon.ico`. `insertBefore=null` appends rather than clearing the
  // head's existing content.
  get documentHead() {
    return document.head;
  }

  <template>
    {{#if this.stationId}}
      {{#if this.station}}
        {{pageTitle this.station.name}}

        {{#in-element this.documentHead insertBefore=null}}
          <link rel="icon" type="image/svg+xml" href={{this.faviconDataUri}} />
        {{/in-element}}
      {{/if}}

      <Station @station={{this.station}} />
    {{/if}}
  </template>
}
