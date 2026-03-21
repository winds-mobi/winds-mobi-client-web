import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import type RouterService from '@ember/routing/router-service';
import { on } from '@ember/modifier';
import StationSummary from './summary';
import StationWinds from './wind';
import StationAir from './air';
import { t } from 'ember-intl';
import {
  parseMapView,
  serializeMapView,
  type MapQueryParams,
} from 'winds-mobi-client-web/utils/map-view';
import type { History, Station } from 'winds-mobi-client-web/services/store.js';

export interface StationIndexSignature {
  Args: {
    history: History[];
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationIndex extends Component<StationIndexSignature> {
  @service declare router: RouterService;

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
      class="pointer-events-auto flex h-[50svh] w-full flex-col overflow-hidden rounded-t-3xl border-x border-t border-slate-200 bg-white shadow-2xl md:h-full md:max-h-full md:w-[32rem] md:max-w-[calc(100%-2rem)] md:rounded-2xl md:border"
    >
      <div
        class="shrink-0 flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3"
      >
        <h1 data-test-station-title class="min-w-0 truncate text-xl font-bold">
          {{@station.name}}
        </h1>
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

      <div class="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-200">
        <StationSummary @station={{@station}} @history={{@history}} />
        <StationWinds @history={{@history}} />
        <StationAir @history={{@history}} />
      </div>
    </section>
  </template>
}
