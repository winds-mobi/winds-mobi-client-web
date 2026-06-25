import type { TOC } from '@ember/component/template-only';
import { LinkTo } from '@ember/routing';
import { formatNumber } from 'ember-intl';
import { t } from 'ember-intl';
import ClockCounterClockwise from 'ember-phosphor-icons/components/ph-clock-counter-clockwise';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import timeAgo, {
  relativeSecondsFromTimestamp,
} from 'winds-mobi-client-web/helpers/time-ago';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';
import { textClassForReadingAge } from 'winds-mobi-client-web/utils/reading-freshness';
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

const StationCompactCard: TOC<StationCompactCardSignature> = <template>
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
          @query={{focusQueryParamsFor @station}}
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

      <dl class="m-0">
        <StationMetaItem
          @icon={{ClockCounterClockwise}}
          @label={{t "station.meta.updated"}}
          class="text-[11px] text-slate-500"
        >
          <span
            class={{textClassForReadingAge @station.last.timestamp}}
          >{{timeAgo
              (relativeSecondsFromTimestamp @station.last.timestamp)
            }}</span>
        </StationMetaItem>
      </dl>
    </div>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col items-center gap-1">
      <dl class="m-0 flex items-baseline gap-1">
        <dt class="sr-only">{{t "wind.speed"}}</dt>
        <dd
          class="m-0 text-[1.5rem] font-semibold leading-none
            {{windToTextClass @station.last.speed}}"
        >
          {{formatNumber @station.last.speed format="integer"}}
        </dd>

        <span aria-hidden="true" class="text-slate-400">/</span>

        <dt class="sr-only">{{t "wind.gusts"}}</dt>
        <dd
          class="m-0 text-base font-semibold leading-none
            {{windToTextClass @station.last.gusts}}"
        >
          {{formatNumber @station.last.gusts format="integer"}}
        </dd>

        <dd class="m-0 text-xs text-slate-500">km/h</dd>
      </dl>

      <div class="flex min-h-0 w-full flex-1 items-center justify-center">
        <StationWindDirectionThumbnail
          @stationId={{@station.id}}
          class="aspect-square h-full max-h-full max-w-full"
        />
      </div>
    </div>
  </article>
</template>;

export default StationCompactCard;
