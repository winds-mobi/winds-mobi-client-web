import Component from '@glimmer/component';
import { service } from '@ember/service';
import { LinkTo } from '@ember/routing';
import { formatNumber } from 'ember-intl';
import { t } from 'ember-intl';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';
import SettingsWindArrow from 'winds-mobi-client-web/components/settings/wind-arrow';
import StationMetaItem from './meta-item';
import StationUpdatedMeta from './updated-meta';
import StationWindDirectionThumbnail from './wind-direction-thumbnail';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type { Station } from 'winds-mobi-client-web/services/store.js';

export interface StationCompactCardSignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLDivElement;
}

export default class StationCompactCard extends Component<StationCompactCardSignature> {
  @service declare settings: SettingsService;

  <template>
    <article
      ...attributes
      class="flex aspect-[3/2] min-h-0 flex-col gap-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-md shadow-slate-900/12"
      data-test-nearby-station-card-compact={{@station.id}}
    >
      <div class="flex min-w-0 items-center justify-between gap-2">
        <LinkTo
          data-test-station-title
          @route="map.station"
          @model={{@station.id}}
          @query={{focusQueryParamsFor @station}}
          title={{t "station.showOnMap"}}
          class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-950 underline decoration-transparent underline-offset-3 transition hover:decoration-slate-300"
        >
          {{@station.name}}
        </LinkTo>

        <dl class="m-0 shrink-0">
          <StationMetaItem
            @icon={{if @station.isPeak Mountains}}
            @label={{t "station.meta.altitude"}}
            class="text-xs text-slate-500"
          >
            <span>{{formatNumber @station.altitude maximumFractionDigits=0}}
              m</span>
          </StationMetaItem>
        </dl>

        <dl class="m-0 shrink-0">
          <StationUpdatedMeta
            @timestamp={{@station.last.timestamp}}
            @isCompact={{true}}
          />
        </dl>
      </div>

      <div class="flex min-h-0 flex-1 gap-3">
        <div
          class="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-1"
        >
          <SettingsWindArrow
            class="aspect-square h-2/3 max-h-2/3 max-w-2/3"
            @direction={{@station.last.direction}}
            @speed={{@station.last.speed}}
            @gusts={{@station.last.gusts}}
            @showGusts={{this.settings.showGustsOutline}}
          />

          <dl class="m-0 flex items-baseline gap-1">
            <dt class="sr-only">{{t "wind.speed"}}</dt>
            <dd
              class="m-0 text-lg font-semibold leading-none
                {{windToTextClass @station.last.speed}}"
            >
              {{formatNumber @station.last.speed format="integer"}}
            </dd>

            <span aria-hidden="true" class="text-slate-400">–</span>

            <dt class="sr-only">{{t "wind.gusts"}}</dt>
            <dd
              class="m-0 text-sm font-semibold leading-none
                {{windToTextClass @station.last.gusts}}"
            >
              {{formatNumber @station.last.gusts format="integer"}}
            </dd>

            <dd class="m-0 text-xs text-slate-500">km/h</dd>
          </dl>
        </div>

        <div class="flex min-h-0 min-w-0 flex-1 items-center justify-center">
          <StationWindDirectionThumbnail
            @stationId={{@station.id}}
            class="aspect-square h-full max-h-full max-w-full"
          />
        </div>
      </div>
    </article>
  </template>
}
