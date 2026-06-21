import Component from '@glimmer/component';
import { service } from '@ember/service';
import { LinkTo } from '@ember/routing';
import { formatNumber } from 'ember-intl';
import { t } from 'ember-intl';
import ArrowSquareUpRight from 'ember-phosphor-icons/components/ph-arrow-square-up-right';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import NavigationArrow from 'ember-phosphor-icons/components/ph-navigation-arrow';
import formatDistanceKm from 'winds-mobi-client-web/helpers/format-distance-km';
import timeAgo from 'winds-mobi-client-web/helpers/time-ago';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';
import StationMetaItem from './meta-item';

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

  get hasProviderLink() {
    return Boolean(
      this.args.station.providerName && this.args.station.providerUrl
    );
  }

  get lastReadingRelativeSeconds() {
    return Math.round(
      this.args.station.last.timestamp / 1000 - Date.now() / 1000
    );
  }

  get focusQueryParams() {
    return focusQueryParamsFor(this.args.station);
  }

  <template>
    <div class="min-w-0">
      <h2 class="min-w-0">
        <LinkTo
          data-test-station-title
          @route="map.station"
          @model={{@station.id}}
          @query={{this.focusQueryParams}}
          title={{t "station.showOnMap"}}
          class="block truncate text-xl font-bold text-slate-950 underline decoration-transparent underline-offset-3 transition hover:decoration-slate-300"
        >
          {{@station.name}}
        </LinkTo>
      </h2>

      <dl
        class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium text-slate-500"
      >
        {{! Peaks (free-flight take-off sites) get the mountain glyph; other }}
        {{! stations show altitude with no icon. }}
        <StationMetaItem
          @icon={{if @station.isPeak Mountains}}
          @label={{t "station.meta.altitude"}}
        >
          <span>{{formatNumber @station.altitude maximumFractionDigits=0}}
            m</span>
        </StationMetaItem>

        <StationMetaItem @label={{t "station.meta.updated"}}>
          <span>{{timeAgo this.lastReadingRelativeSeconds}}</span>
        </StationMetaItem>

        {{#let this.nearbyLocation.coordinates as |coordinates|}}
          {{#let
            (formatDistanceKm
              coordinates.latitude
              coordinates.longitude
              @station.latitude
              @station.longitude
            )
            as |distanceLabel|
          }}
            {{#if distanceLabel}}
              <StationMetaItem
                data-test-station-distance
                @icon={{NavigationArrow}}
                @label={{t "station.meta.distance"}}
              >
                <span>{{distanceLabel}}</span>
              </StationMetaItem>
            {{/if}}
          {{/let}}
        {{/let}}

        {{#if this.hasProviderLink}}
          <StationMetaItem
            @icon={{ArrowSquareUpRight}}
            @label={{t "station.meta.provider"}}
          >
            <span>
              <a
                data-test-station-provider-link
                href={{@station.providerUrl}}
                target="_blank"
                rel="noopener noreferrer"
                class="underline decoration-slate-300 underline-offset-3 transition hover:text-slate-900 hover:decoration-slate-500"
              >
                {{@station.providerName}}
              </a>
            </span>
          </StationMetaItem>
        {{/if}}
      </dl>
    </div>
  </template>
}
