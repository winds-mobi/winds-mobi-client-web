import Component from '@glimmer/component';
import { service } from '@ember/service';
import type { IntlService } from 'ember-intl';
import { formatNumber } from 'ember-intl';
import { t } from 'ember-intl';
import ArrowSquareUpRight from 'ember-phosphor-icons/components/ph-arrow-square-up-right';
import ClockCounterClockwise from 'ember-phosphor-icons/components/ph-clock-counter-clockwise';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import NavigationArrow from 'ember-phosphor-icons/components/ph-navigation-arrow';
import timeAgo from 'winds-mobi-client-web/helpers/time-ago';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { distanceKm } from 'winds-mobi-client-web/utils/distance';

export interface StationHeaderSignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationHeader extends Component<StationHeaderSignature> {
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;
  @service declare intl: IntlService;

  get lastReadingRelativeSeconds() {
    return Math.round(
      this.args.station.last.timestamp / 1000 - Date.now() / 1000
    );
  }

  get formattedDistanceKm() {
    const coordinates = this.nearbyLocation.coordinates;

    if (!coordinates) {
      return undefined;
    }

    const distance = distanceKm(
      coordinates.latitude,
      coordinates.longitude,
      this.args.station.latitude,
      this.args.station.longitude
    );

    return `${this.intl.formatNumber(distance, {
      maximumFractionDigits: distance < 10 ? 1 : 0,
    })} km`;
  }

  <template>
    <div class="min-w-0">
      <h2
        data-test-station-title
        class="min-w-0 truncate text-xl font-bold text-slate-950"
      >
        {{@station.name}}
      </h2>

      <dl class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
        <div class="flex items-center gap-1.5">
          <dt class="sr-only">{{t "station.meta.altitude"}}</dt>
          <dd class="m-0 inline-flex items-center gap-1.5">
            <Mountains @size={{12}} class="text-slate-400" />
            <span>{{formatNumber @station.altitude maximumFractionDigits=0}} m</span>
          </dd>
        </div>

        <div class="flex items-center gap-1.5">
          <dt class="sr-only">{{t "station.meta.updated"}}</dt>
          <dd class="m-0 inline-flex items-center gap-1.5">
            <ClockCounterClockwise @size={{12}} class="text-slate-400" />
            <span>{{timeAgo this.lastReadingRelativeSeconds}}</span>
          </dd>
        </div>

        {{#if this.formattedDistanceKm}}
          <div class="flex items-center gap-1.5">
            <dt class="sr-only">{{t "station.meta.distance"}}</dt>
            <dd
              data-test-station-distance
              class="m-0 inline-flex items-center gap-1.5"
            >
              <NavigationArrow @size={{12}} class="text-slate-400" />
              <span>{{this.formattedDistanceKm}}</span>
            </dd>
          </div>
        {{/if}}

        <div class="flex items-center gap-1.5">
          <dt class="sr-only">{{t "station.meta.provider"}}</dt>
          <dd class="m-0 inline-flex items-center gap-1.5">
            <ArrowSquareUpRight @size={{12}} class="text-slate-400" />
            <a
              data-test-station-provider-link
              href={{@station.providerUrl}}
              target="_blank"
              rel="noopener noreferrer"
              class="underline decoration-slate-300 underline-offset-3 transition hover:text-slate-900 hover:decoration-slate-500"
            >
              {{@station.providerName}}
            </a>
          </dd>
        </div>
      </dl>
    </div>
  </template>
}
