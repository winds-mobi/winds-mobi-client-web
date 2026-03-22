import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import type RouterService from '@ember/routing/router-service';
import { on } from '@ember/modifier';
import StationSummary from './summary';
import StationWinds from './wind';
import StationAir from './air';
import RelativeTime from '../relative-time';
import { t } from 'ember-intl';
import {
  parseMapView,
  serializeMapView,
  type MapQueryParams,
} from 'winds-mobi-client-web/utils/map-view';
import type { History, Station } from 'winds-mobi-client-web/services/store.js';

export interface StationIndexSignature {
  Args: {
    history?: History[];
    station?: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationIndex extends Component<StationIndexSignature> {
  @service declare router: RouterService;

  get station() {
    return this.args.station;
  }

  get history() {
    return this.args.history ?? [];
  }

  get mapView() {
    return parseMapView(
      this.router.currentRoute?.queryParams as MapQueryParams | undefined
    );
  }

  @action
  close() {
    this.router.transitionTo('map', {
      queryParams: serializeMapView(this.mapView),
    });
  }

  <template>
    <section
      data-test-station-panel
      class="flex h-[24rem] w-full shrink-0 flex-col overflow-hidden border-t border-slate-200 bg-white shadow-md shadow-slate-900/12 md:h-full md:w-[32rem] md:border-r md:border-t-0 md:shadow-[12px_0_28px_-12px_rgba(15,23,42,0.42)]"
    >
      <div class="shrink-0 flex items-center justify-between gap-4 px-4 py-3">
        <div class="min-w-0 flex items-baseline gap-3">
          {{#if this.station}}
            <h1
              data-test-station-title
              class="min-w-0 truncate text-xl font-bold"
            >
              {{this.station.name}}
            </h1>
            <div class="shrink-0 text-xs font-medium text-slate-500">
              <RelativeTime @timestamp={{this.station.last.timestamp}} />
            </div>
          {{else}}
            <div
              data-test-station-title-loading
              class="h-7 w-40 max-w-full animate-pulse rounded-md bg-slate-200"
            ></div>
            <div
              class="h-4 w-20 shrink-0 animate-pulse rounded-md bg-slate-200"
            ></div>
          {{/if}}
        </div>
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

      <div class="min-h-0 flex-1 overflow-y-auto">
        {{#if this.station}}
          <StationSummary @station={{this.station}} @history={{this.history}} />
          <StationWinds @history={{this.history}} />
          <StationAir @history={{this.history}} />
        {{else}}
          <div
            data-test-station-panel-loading
            class="grid gap-3 px-4 py-4 sm:px-5"
          >
            <div class="grid min-w-0 grid-cols-2 gap-3">
              <div
                class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div class="h-3 w-14 animate-pulse rounded bg-slate-200"></div>
                <div class="mt-3 space-y-2.5">
                  <div
                    class="h-[3.625rem] animate-pulse rounded-xl bg-slate-100 ring-1 ring-slate-200/80"
                  ></div>
                  <div
                    class="h-[3.625rem] animate-pulse rounded-xl bg-slate-100 ring-1 ring-slate-200/80"
                  ></div>
                  <div
                    class="h-[3.625rem] animate-pulse rounded-xl bg-slate-100 ring-1 ring-slate-200/80"
                  ></div>
                </div>
              </div>

              <div
                class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div class="h-3 w-10 animate-pulse rounded bg-slate-200"></div>
                <div class="mt-3 space-y-2.5">
                  <div
                    class="h-[3.625rem] animate-pulse rounded-xl bg-slate-100 ring-1 ring-slate-200/80"
                  ></div>
                  <div
                    class="h-[3.625rem] animate-pulse rounded-xl bg-slate-100 ring-1 ring-slate-200/80"
                  ></div>
                  <div
                    class="h-[3.625rem] animate-pulse rounded-xl bg-slate-100 ring-1 ring-slate-200/80"
                  ></div>
                </div>
              </div>
            </div>

            <div
              class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div class="h-3 w-24 animate-pulse rounded bg-slate-200"></div>
              <div
                class="mt-3 grid grid-cols-[minmax(0,1fr)_9rem] gap-3 md:grid-cols-[minmax(0,1fr)_12rem]"
              >
                <div
                  class="min-h-40 animate-pulse rounded-xl bg-slate-100 ring-1 ring-slate-200/80"
                ></div>
                <div class="grid gap-2">
                  <div
                    class="h-[3.625rem] animate-pulse rounded-xl bg-slate-100 ring-1 ring-slate-200/80"
                  ></div>
                  <div
                    class="h-[3.625rem] animate-pulse rounded-xl bg-slate-100 ring-1 ring-slate-200/80"
                  ></div>
                  <div
                    class="h-[3.625rem] animate-pulse rounded-xl bg-slate-100 ring-1 ring-slate-200/80"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        {{/if}}
      </div>
    </section>
  </template>
}
