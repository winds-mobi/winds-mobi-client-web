import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { LinkTo } from '@ember/routing';
import { Button } from '@frontile/buttons';
import { formatNumber } from 'ember-intl';
import { t } from 'ember-intl';
import ArrowSquareUpRight from 'ember-phosphor-icons/components/ph-arrow-square-up-right';
import Heart from 'ember-phosphor-icons/components/ph-heart';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import NavigationArrow from 'ember-phosphor-icons/components/ph-navigation-arrow';
import formatDistanceKm from 'winds-mobi-client-web/helpers/format-distance-km';
import type FavoritesService from 'winds-mobi-client-web/services/favorites';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';
import StationMetaItem from './meta-item';
import StationUpdatedMeta from './updated-meta';

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
  @service declare favorites: FavoritesService;
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;
  @service declare settings: SettingsService;

  get hasProviderLink() {
    return Boolean(
      this.args.station.providerName && this.args.station.providerUrl
    );
  }

  // Favouriting is a beta feature (see app/services/settings.ts): hidden
  // until beta is opted into *and* the favourites feature's own toggle is on.
  // No account is required — favourites persist locally (see
  // app/services/favorites.ts).
  get showFavoriteControl(): boolean {
    return (
      this.settings.betaFeaturesEnabled && this.settings.favoritesFeatureEnabled
    );
  }

  get isFavorite(): boolean {
    return this.favorites.has(this.args.station.id);
  }

  @action
  handleToggleFavorite() {
    this.favorites.toggle(this.args.station.id);
  }

  <template>
    <div class="min-w-0">
      <div class="flex items-start justify-between gap-2">
        <h2 class="min-w-0 flex-1">
          <LinkTo
            data-test-station-title
            @route="map.station"
            @model={{@station.id}}
            @query={{focusQueryParamsFor @station}}
            title={{t "station.showOnMap"}}
            class="block truncate text-xl font-bold text-slate-950 underline decoration-transparent underline-offset-3 transition hover:decoration-slate-300"
          >
            {{@station.name}}
          </LinkTo>
        </h2>

        {{#if this.showFavoriteControl}}
          <Button
            aria-label={{if
              this.isFavorite
              (t "station.favorite.remove")
              (t "station.favorite.add")
            }}
            aria-pressed={{if this.isFavorite "true" "false"}}
            data-test-station-favorite
            @appearance="minimal"
            @size="sm"
            @onPress={{this.handleToggleFavorite}}
          >
            <Heart
              @size={{20}}
              @weight={{if this.isFavorite "fill" "regular"}}
              class={{if this.isFavorite "text-rose-500" "text-slate-400"}}
            />
          </Button>
        {{/if}}
      </div>

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
    </div>
  </template>
}
