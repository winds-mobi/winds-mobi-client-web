import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { LinkTo } from '@ember/routing';
import { Button } from '@frontile/buttons';
import { getRequestState } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import { task } from 'ember-concurrency';
import { formatNumber } from 'ember-intl';
import { t } from 'ember-intl';
import ArrowSquareUpRight from 'ember-phosphor-icons/components/ph-arrow-square-up-right';
import ClockCounterClockwise from 'ember-phosphor-icons/components/ph-clock-counter-clockwise';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import NavigationArrow from 'ember-phosphor-icons/components/ph-navigation-arrow';
import Star from 'ember-phosphor-icons/components/ph-star';
import {
  addFavorite,
  profileQuery,
  removeFavorite,
} from 'winds-mobi-client-web/builders/profile';
import formatDistanceKm from 'winds-mobi-client-web/helpers/format-distance-km';
import timeAgo, {
  relativeSecondsFromTimestamp,
} from 'winds-mobi-client-web/helpers/time-ago';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type SessionService from 'winds-mobi-client-web/services/session';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type {
  Profile,
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store.js';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';
import { textClassForReadingAge } from 'winds-mobi-client-web/utils/reading-freshness';
import { responseData } from 'winds-mobi-client-web/utils/request-response';
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
  @service declare session: SessionService;
  @service declare settings: SettingsService;
  @service declare store: StoreService;

  get hasProviderLink() {
    return Boolean(
      this.args.station.providerName && this.args.station.providerUrl
    );
  }

  // Favouriting is a beta feature (see app/services/settings.ts): still
  // gated on being signed in, but also hidden until beta is opted into.
  get showFavoriteControl(): boolean {
    return this.session.isAuthenticated && this.settings.betaFeaturesEnabled;
  }

  @cached
  get profileRequest(): Future<{ data: Profile }> | undefined {
    if (!this.session.isAuthenticated) {
      return undefined;
    }

    return this.store.request<{ data: Profile }>(profileQuery());
  }

  get profile(): Profile | undefined {
    const state = this.profileRequest
      ? getRequestState(this.profileRequest)
      : undefined;

    return state?.isSuccess ? responseData(state.value) : undefined;
  }

  get isFavorite(): boolean {
    return this.profile?.favorites.includes(this.args.station.id) === true;
  }

  // 204s with no body, so a profile refetch updates the shared record (and
  // with it every star and the favourites view) after the mutation lands.
  toggleFavorite = task({ drop: true }, async () => {
    const stationId = this.args.station.id;

    await this.store.request(
      this.isFavorite ? removeFavorite(stationId) : addFavorite(stationId)
    );
    await this.store.request(profileQuery());
  });

  @action
  handleToggleFavorite() {
    void this.toggleFavorite.perform();
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
            disabled={{this.toggleFavorite.isRunning}}
            @appearance="minimal"
            @size="sm"
            @onPress={{this.handleToggleFavorite}}
          >
            <Star
              @size={{20}}
              @weight={{if this.isFavorite "fill" "regular"}}
              class={{if this.isFavorite "text-amber-500" "text-slate-400"}}
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

        <StationMetaItem
          @icon={{ClockCounterClockwise}}
          @label={{t "station.meta.updated"}}
        >
          <span
            class={{textClassForReadingAge @station.last.timestamp}}
          >{{timeAgo
              (relativeSecondsFromTimestamp @station.last.timestamp)
            }}</span>
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
