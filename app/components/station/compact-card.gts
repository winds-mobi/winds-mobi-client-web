import Component from '@glimmer/component';
import { LinkTo } from '@ember/routing';
import { service } from '@ember/service';
import { formatNumber } from 'ember-intl';
import { t } from 'ember-intl';
import type { IntlService } from 'ember-intl';
import ClockCounterClockwise from 'ember-phosphor-icons/components/ph-clock-counter-clockwise';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import timeAgo from 'winds-mobi-client-web/helpers/time-ago';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';
import StationMetaItem from './meta-item';
import StationWindDirectionThumbnail from './wind-direction-thumbnail';
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
  @service declare intl: IntlService;

  get reading() {
    return this.args.station.last;
  }

  get speedValueClass() {
    return windToTextClass(this.reading.speed);
  }

  get gustsValueClass() {
    return windToTextClass(this.reading.gusts);
  }

  get lastReadingRelativeSeconds() {
    return Math.round(
      this.args.station.last.timestamp / 1000 - Date.now() / 1000
    );
  }

  get focusQueryParams() {
    return focusQueryParamsFor(this.args.station);
  }

  get windSpeedLabel() {
    return this.intl.formatNumber(this.reading.speed, { format: 'integer' });
  }

  get gustsLabel() {
    return this.intl.formatNumber(this.reading.gusts, { format: 'integer' });
  }

  <template>
    <article
      ...attributes
      class="flex aspect-[3/2] min-h-0 gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-md shadow-slate-900/12"
      data-test-nearby-station-card-compact={{@station.id}}
    >
      <div class="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
        <div class="min-w-0">
          <LinkTo
            data-test-station-title
            @route="map.station"
            @model={{@station.id}}
            @query={{this.focusQueryParams}}
            title={{t "station.showOnMap"}}
            class="block truncate text-sm font-semibold text-slate-950 underline decoration-transparent underline-offset-3 transition hover:decoration-slate-300"
          >
            {{@station.name}}
          </LinkTo>

          <dl class="m-0">
            <StationMetaItem
              @icon={{if @station.isPeak Mountains}}
              @label={{t "station.meta.altitude"}}
              class="text-xs text-slate-500"
            >
              <span>{{formatNumber @station.altitude maximumFractionDigits=0}}
                m</span>
            </StationMetaItem>
          </dl>
        </div>

        <dl class="m-0 flex items-baseline gap-1">
          <dt class="sr-only">{{t "wind.speed"}}</dt>
          <dd
            class="m-0 text-[1.5rem] font-semibold leading-none
              {{this.speedValueClass}}"
          >
            {{this.windSpeedLabel}}
          </dd>

          <span aria-hidden="true" class="text-slate-400">/</span>

          <dt class="sr-only">{{t "wind.gusts"}}</dt>
          <dd
            class="m-0 text-base font-semibold leading-none
              {{this.gustsValueClass}}"
          >
            {{this.gustsLabel}}
          </dd>

          <dd class="m-0 text-xs text-slate-500">km/h</dd>
        </dl>

        <dl class="m-0">
          <StationMetaItem
            @icon={{ClockCounterClockwise}}
            @label={{t "station.meta.updated"}}
            class="text-[11px] text-slate-500"
          >
            <span>{{timeAgo this.lastReadingRelativeSeconds}}</span>
          </StationMetaItem>
        </dl>
      </div>

      <div class="flex min-h-0 min-w-0 flex-1 items-center justify-center">
        <StationWindDirectionThumbnail
          @stationId={{@station.id}}
          class="aspect-square h-full max-h-full max-w-full"
        />
      </div>
    </article>
  </template>
}
