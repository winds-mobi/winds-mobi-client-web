import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import type RouterService from '@ember/routing/router-service';
import { on } from '@ember/modifier';
import StationSummary from './summary';
import StationWinds from './wind';
import StationAir from './air';
import { formatNumber, t } from 'ember-intl';
import timeAgo from 'winds-mobi-client-web/helpers/time-ago';
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

  get lastReadingRelativeSeconds() {
    return Math.round(this.args.station!.last.timestamp / 1000 - Date.now() / 1000);
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
              <span>{{formatNumber this.station.altitude maximumFractionDigits=0}} m</span>
              <span class="mx-1.5 text-slate-300">&middot;</span>
              {{timeAgo this.lastReadingRelativeSeconds}}
            </div>
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
          <div class="grid gap-3 px-4 py-3 sm:px-5 md:gap-4 md:py-4">
            <StationSummary
              @station={{this.station}}
              @history={{this.history}}
            />
            <StationWinds @history={{this.history}} />
            <StationAir @history={{this.history}} />
          </div>
        {{/if}}
      </div>
    </section>
  </template>
}
