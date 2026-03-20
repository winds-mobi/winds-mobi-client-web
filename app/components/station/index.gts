/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
import Component from '@glimmer/component';
import type StoreService from 'winds-mobi-client-web/services/store.js';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import { Request } from '@warp-drive/ember';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { service } from '@ember/service';
import { action } from '@ember/object';
import type RouterService from '@ember/routing/router-service';
import { on } from '@ember/modifier';
import StationSummary from './summary';
import StationWinds from './wind';
import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import StationAir from './air';
import {
  parseMapView,
  serializeMapView,
  type MapQueryParams,
} from 'winds-mobi-client-web/utils/map-view';
import {
  stationTabFromRouteName,
  type StationTab,
} from 'winds-mobi-client-web/utils/station-route';

export interface StationIndexSignature {
  Args: {
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationIndex extends Component<StationIndexSignature> {
  @service declare store: StoreService;
  @service declare router: RouterService;

  get stationRequest() {
    const options = findRecord<Station>('station', this.args.stationId);
    return this.store.request(options);
  }

  get mapView() {
    return parseMapView(
      this.router.currentRoute?.queryParams as MapQueryParams | undefined
    );
  }

  get currentTab(): StationTab {
    return stationTabFromRouteName(this.router.currentRouteName);
  }

  get isSummaryTab() {
    return this.currentTab === 'summary';
  }

  get isWindsTab() {
    return this.currentTab === 'winds';
  }

  @action
  close() {
    this.router.transitionTo('map', {
      queryParams: serializeMapView(this.mapView),
    });
  }

  <template>
    <Request @request={{this.stationRequest}}>
      <:loading>
        ---
      </:loading>

      <:content as |result|>
        <section
          data-test-station-panel
          class="pointer-events-auto flex max-h-[calc(100%-0.5rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:h-full sm:max-h-full sm:w-[32rem] sm:max-w-[calc(100%-2rem)] sm:rounded-2xl"
        >
          <div class="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
            <span
              data-test-station-title
              class="min-w-0 truncate text-xl font-bold"
            >
              {{result.data.name}}
            </span>
            <button
              data-test-station-close
              type="button"
              class="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label={{t "common.close"}}
              title={{t "common.close"}}
              {{on "click" this.close}}
            >
              &times;
            </button>
          </div>

          <div class="border-b border-gray-200">
            <nav class="-mb-px flex w-full" aria-label={{t "station.tabs"}}>
              <LinkTo
                @route="map.station.summary"
                @model={{@stationId}}
                data-test-station-tab-summary
                class="flex-1 border-b-2 px-3 py-4 text-center text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                @activeClass="border-indigo-500 text-indigo-600"
              >{{t "station.summary.title"}}</LinkTo>
              <LinkTo
                @route="map.station.winds"
                @model={{@stationId}}
                data-test-station-tab-winds
                class="flex-1 border-b-2 px-3 py-4 text-center text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                @activeClass="border-indigo-500 text-indigo-600"
              >{{t "station.wind"}}</LinkTo>
              <LinkTo
                @route="map.station.air"
                @model={{@stationId}}
                data-test-station-tab-air
                class="flex-1 border-b-2 px-3 py-4 text-center text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                @activeClass="border-indigo-500 text-indigo-600"
              >{{t "station.air"}}</LinkTo>
            </nav>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto">
            {{#if this.isSummaryTab}}
              <StationSummary @stationId={{@stationId}} />
            {{else if this.isWindsTab}}
              <StationWinds @stationId={{@stationId}} />
            {{else}}
              <StationAir @stationId={{@stationId}} />
            {{/if}}
          </div>
        </section>
      </:content>
    </Request>
  </template>
}
