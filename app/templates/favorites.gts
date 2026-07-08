import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import { favoritesQuery } from 'winds-mobi-client-web/builders/station';
import { profileQuery } from 'winds-mobi-client-web/builders/profile';
import AuthSignInLinks from 'winds-mobi-client-web/components/auth/sign-in-links';
import StationNearbyCard from 'winds-mobi-client-web/components/station/nearby-card';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';
import commitResolvedStations from 'winds-mobi-client-web/modifiers/commit-resolved-stations';
import registerLoadingProbe from 'winds-mobi-client-web/modifiers/register-loading-probe';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type SessionService from 'winds-mobi-client-web/services/session';
import type {
  Profile,
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store';
import { responseData } from 'winds-mobi-client-web/utils/request-response';

interface FavoritesTemplateSignature {
  Args: {
    model: unknown;
  };
}

export default class FavoritesTemplate extends Component<FavoritesTemplateSignature> {
  @service declare mapRefresh: MapRefreshService;
  @service declare session: SessionService;
  @service declare store: StoreService;

  @cached
  get profileRequest(): Future<{ data: Profile }> | undefined {
    if (!this.session.isAuthenticated) {
      return undefined;
    }

    return this.store.request<{ data: Profile }>(profileQuery());
  }

  get profileState() {
    return this.profileRequest
      ? getRequestState(this.profileRequest)
      : undefined;
  }

  get favoriteIds(): string[] | undefined {
    const state = this.profileState;

    return state?.isSuccess ? responseData(state.value).favorites : undefined;
  }

  // Recreated when the profile's favorites change or the shared refresh tick
  // fires — same shape as the nearby view: no `backgroundReload`, the latch
  // below keeps the previous cards on screen while a reload is in flight.
  @cached
  get stationsRequest(): Future<{ data: Station[] }> | undefined {
    const ids = this.favoriteIds;

    if (!ids || ids.length === 0) {
      return undefined;
    }

    // Read so each refresh tick invalidates this getter and refetches.
    this.mapRefresh.lastRefresh;

    return this.store.request<{ data: Station[] }>(
      favoritesQuery<Station>('station', ids)
    );
  }

  get requestState() {
    return this.stationsRequest
      ? getRequestState(this.stationsRequest)
      : undefined;
  }

  // Last successfully-loaded stations, committed by `commitResolvedStations`
  // on each resolve, so the cards stay on screen while a refresh reloads.
  @tracked private lastStations: Station[] = [];

  commitStations = (stations: Station[]) => {
    this.lastStations = stations;
  };

  get stations(): Station[] {
    const stations = this.requestState?.isSuccess
      ? responseData(this.requestState.value)
      : this.lastStations;

    // The API doesn't guarantee `ids` order — present in profile order.
    const order = new Map(
      (this.favoriteIds ?? []).map((id, index) => [id, index])
    );

    return [...stations].sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    );
  }

  // Reports to the shared refresh service whether this view is loading, so
  // the navbar refresh control spins while either request is in flight.
  loadingProbe = (): boolean => {
    return (
      this.requestState?.isPending === true ||
      this.profileState?.isPending === true
    );
  };

  get isInitialLoad(): boolean {
    return this.loadingProbe() && this.lastStations.length === 0;
  }

  get isError(): boolean {
    return (
      this.requestState?.isError === true || this.profileState?.isError === true
    );
  }

  get hasNoFavorites(): boolean {
    return this.favoriteIds?.length === 0;
  }

  <template>
    {{pageTitle (t "favorites.title")}}

    <section
      class="min-h-0 flex-1 overflow-y-auto bg-slate-200"
      {{commitResolvedStations this.requestState this.commitStations}}
      {{registerLoadingProbe this.mapRefresh this.loadingProbe}}
    >
      <div class="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {{#if this.session.isAuthenticated}}
          {{#if this.isError}}
            <StationSectionCard
              data-test-favorites-error
              @title={{t "favorites.title"}}
              @titleClass="text-rose-700"
            >
              <p class="py-10 text-center text-sm font-medium text-rose-700">
                {{t "favorites.requestError"}}
              </p>
            </StationSectionCard>
          {{else if this.hasNoFavorites}}
            <StationSectionCard
              data-test-favorites-empty
              @title={{t "favorites.title"}}
            >
              <p class="py-10 text-center text-sm font-medium text-slate-500">
                {{t "favorites.empty"}}
              </p>
            </StationSectionCard>
          {{else if this.isInitialLoad}}
            <StationSectionCard
              data-test-favorites-loading
              @title={{t "favorites.title"}}
            >
              <p class="py-10 text-center text-sm font-medium text-slate-500">
                {{t "favorites.loading"}}
              </p>
            </StationSectionCard>
          {{else}}
            <div
              class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(22rem,1fr))]"
              data-test-favorites-stations
            >
              {{#each this.stations as |station|}}
                <StationNearbyCard @station={{station}} />
              {{/each}}
            </div>
          {{/if}}
        {{else}}
          <StationSectionCard
            data-test-favorites-signed-out
            @title={{t "favorites.title"}}
          >
            <div class="max-w-2xl">
              <p class="text-sm leading-6 text-slate-600">
                {{t "favorites.signedOut"}}
              </p>

              <div class="mt-4">
                <AuthSignInLinks />
              </div>
            </div>
          </StationSectionCard>
        {{/if}}
      </div>
    </section>
  </template>
}
