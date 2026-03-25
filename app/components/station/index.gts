import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import type RouterService from '@ember/routing/router-service';
import { on } from '@ember/modifier';
import { Switch } from '@frontile/forms';
import StationSummary from './summary';
import StationAir from './air';
import StationWind from './wind';
import { formatNumber, t } from 'ember-intl';
import LockSimple from 'ember-phosphor-icons/components/ph-lock-simple';
import LockSimpleOpen from 'ember-phosphor-icons/components/ph-lock-simple-open';
import timeAgo from 'winds-mobi-client-web/helpers/time-ago';
import {
  parseMapView,
  serializeMapView,
  type MapQueryParams,
} from 'winds-mobi-client-web/utils/map-view';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import type TimeSeriesSyncService from 'winds-mobi-client-web/services/time-series-sync';

export interface StationIndexSignature {
  Args: {
    station?: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationIndex extends Component<StationIndexSignature> {
  @service declare router: RouterService;
  @service declare timeSeriesSync: TimeSeriesSyncService;

  get lastReadingRelativeSeconds() {
    return Math.round(
      this.args.station!.last.timestamp / 1000 - Date.now() / 1000
    );
  }

  get mapView() {
    return parseMapView(
      this.router.currentRoute?.queryParams as MapQueryParams | undefined
    );
  }

  get isTimeSeriesSyncEnabled() {
    return this.timeSeriesSync.isSyncEnabled;
  }

  @action
  close() {
    this.router.transitionTo('map', {
      queryParams: serializeMapView(this.mapView),
    });
  }

  @action
  toggleTimeSeriesSync(isSelected: boolean) {
    this.timeSeriesSync.setSyncEnabled(isSelected);
  }

  <template>
    <section
      data-test-station-panel
      class="flex h-[24rem] w-full shrink-0 flex-col overflow-hidden border-t border-slate-200 bg-white shadow-md shadow-slate-900/12 md:h-full md:w-[32rem] md:border-r md:border-t-0 md:shadow-[12px_0_28px_-12px_rgba(15,23,42,0.42)]"
    >
      <div class="shrink-0 flex items-center justify-between gap-4 px-4 py-3">
        <div class="min-w-0 flex items-baseline gap-3">
          {{#if @station}}
            <h1
              data-test-station-title
              class="min-w-0 truncate text-xl font-bold"
            >
              {{@station.name}}
            </h1>
            <div class="shrink-0 text-xs font-medium text-slate-500">
              <span>{{formatNumber @station.altitude maximumFractionDigits=0}}
                m</span>
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
        {{#if @station}}
          <div class="grid gap-3 px-4 py-3 sm:px-5 md:gap-4 md:py-4">
            <StationSummary @station={{@station}} />
            <StationWind @stationId={{@station.id}} />
            <StationAir @stationId={{@station.id}} />
            <div class="flex">
              <Switch
                @isSelected={{this.isTimeSeriesSyncEnabled}}
                @onChange={{this.toggleTimeSeriesSync}}
                @intent="success"
                @label={{t "station.timeSeries.sync"}}
                aria-label={{t "station.timeSeries.syncToggle"}}
              >
                <:startContent>
                  <LockSimple @size={{14}} />
                </:startContent>

                <:endContent>
                  <LockSimpleOpen @size={{14}} />
                </:endContent>
              </Switch>
            </div>
          </div>
        {{/if}}
      </div>
    </section>
  </template>
}
