import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import type RouterService from '@ember/routing/router-service';
import { Button } from '@frontile/buttons';
import X from 'ember-phosphor-icons/components/ph-x';
import StationHeader from './header';
import StationMeta from './meta';
import StationSummary from './summary';
import StationAir from './air';
import StationWind from './wind';
import { t } from 'ember-intl';
import { currentMapView } from 'winds-mobi-client-web/utils/map-view';
import type { Station } from 'winds-mobi-client-web/services/store.js';

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

  get mapView() {
    return currentMapView(this.router);
  }

  @action
  close() {
    this.router.transitionTo('map', {
      queryParams: this.mapView,
    });
  }

  <template>
    {{! Fills the map's overlay slot, which owns the panel's size and where it
    sits (`app/components/map/index.gts`) — the map measures that slot to know
    how much of itself the panel covers. }}
    <section
      data-test-station-panel
      class="pointer-events-auto flex h-full w-full flex-col overflow-hidden border-t border-slate-200 bg-white shadow-md shadow-slate-900/12 landscape:border-r landscape:border-t-0 landscape:shadow-[12px_0_28px_-12px_rgba(15,23,42,0.42)] md:border-r md:border-t-0 md:shadow-[12px_0_28px_-12px_rgba(15,23,42,0.42)]"
    >
      <div
        class="relative z-10 shrink-0 flex items-start justify-between gap-4 px-4 py-2 shadow-md shadow-slate-900/10"
      >
        <div class="min-w-0">
          {{#if @station}}
            <StationHeader @station={{@station}} />
          {{/if}}
        </div>
        <Button
          data-test-station-close
          aria-label={{t "common.close"}}
          title={{t "common.close"}}
          @appearance="custom"
          @intent="default"
          @size="xs"
          @onPress={{this.close}}
          class="self-start rounded-md! text-slate-500! transition hover:bg-slate-100 hover:text-slate-900"
        >
          <X @size={{20}} />
        </Button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto">
        {{#if @station}}
          <div class="grid gap-3 px-4 py-3 sm:px-5 md:gap-4 md:py-4">
            <StationMeta @station={{@station}} />
            <StationSummary @station={{@station}} />
            <StationWind @stationId={{@station.id}} />
            <StationAir @stationId={{@station.id}} />
          </div>
        {{/if}}
      </div>
    </section>
  </template>
}
