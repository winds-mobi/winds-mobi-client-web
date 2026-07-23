import Component from '@glimmer/component';
import { service } from '@ember/service';
import { formatNumber } from 'ember-intl';
import { t } from 'ember-intl';
import ArrowSquareUpRight from 'ember-phosphor-icons/components/ph-arrow-square-up-right';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import NavigationArrow from 'ember-phosphor-icons/components/ph-navigation-arrow';
import formatDistanceKm from 'winds-mobi-client-web/helpers/format-distance-km';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import StationMetaItem from './meta-item';
import StationUpdatedMeta from './updated-meta';

export interface StationMetaSignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLDListElement;
}

export default class StationMeta extends Component<StationMetaSignature> {
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;

  get hasProviderLink() {
    return Boolean(
      this.args.station.providerName && this.args.station.providerUrl
    );
  }

  <template>
    <dl
      class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium text-slate-500"
      ...attributes
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

      <StationUpdatedMeta @timestamp={{@station.last.timestamp}} />

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
  </template>
}
