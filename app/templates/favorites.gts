import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import { Alert } from 'frontile/status';
import { byIdsQuery } from 'winds-mobi-client-web/builders/station';
import RefreshingRequest from 'winds-mobi-client-web/components/refreshing-request';
import StationCompactCard from 'winds-mobi-client-web/components/station/compact-card';
import StationNearbyCard from 'winds-mobi-client-web/components/station/nearby-card';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';
import type FavoritesService from 'winds-mobi-client-web/services/favorites';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type {
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store';

interface FavoritesTemplateSignature {
  Args: {
    model: unknown;
  };
}

export default class FavoritesTemplate extends Component<FavoritesTemplateSignature> {
  @service declare favorites: FavoritesService;
  @service declare settings: SettingsService;
  @service declare store: StoreService;

  get favoriteIds(): string[] {
    return this.favorites.stationIds;
  }

  // Recreated when the favourite ids change. A refresh doesn't recreate it: it
  // invalidates the cached response, and `<RefreshingRequest>` in the template
  // re-fetches it in place while the latch keeps the cards on screen.
  @cached
  get stationsRequest(): Future<{ data: Station[] }> | undefined {
    const ids = this.favoriteIds;

    if (ids.length === 0) {
      return undefined;
    }

    return this.store.request<{ data: Station[] }>(
      byIdsQuery<Station>('station', ids)
    );
  }

  get requestState() {
    return this.stationsRequest
      ? getRequestState(this.stationsRequest)
      : undefined;
  }

  // Last successfully-loaded stations, committed by `<RefreshingRequest>`
  // on each resolve, so the cards stay on screen while a refresh reloads.
  @tracked private lastStations: Station[] = [];

  commitStations = (stations: Station[]) => {
    this.lastStations = stations;
  };

  get stations(): Station[] {
    const stations = this.lastStations;

    // The API doesn't guarantee response order — present in the order
    // favourites were added.
    const order = new Map(this.favoriteIds.map((id, index) => [id, index]));

    return [...stations].sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    );
  }

  get isInitialLoad(): boolean {
    return (
      this.requestState?.isPending === true && this.lastStations.length === 0
    );
  }

  get isError(): boolean {
    return this.requestState?.isError === true;
  }

  get hasNoFavorites(): boolean {
    return this.favoriteIds.length === 0;
  }

  <template>
    {{pageTitle (t "favorites.title")}}

    <section class="min-h-0 flex-1 overflow-y-auto bg-slate-200">
      <RefreshingRequest
        @request={{this.stationsRequest}}
        @onResolve={{this.commitStations}}
      />
      <div class="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {{#if this.isError}}
          <StationSectionCard
            data-test-favorites-error
            @title={{t "favorites.title"}}
            @titleClass="text-rose-700"
          >
            <Alert @status="danger" @title={{t "favorites.requestError"}} />
          </StationSectionCard>
        {{else if this.hasNoFavorites}}
          <StationSectionCard
            data-test-favorites-empty
            @title={{t "favorites.title"}}
          >
            <Alert
              @status="neutral"
              @title={{t "favorites.emptyTitle"}}
              @description={{t "favorites.emptyDescription"}}
            />
          </StationSectionCard>
        {{else if this.isInitialLoad}}
          <StationSectionCard
            data-test-favorites-loading
            @title={{t "favorites.title"}}
          >
            <Alert @status="neutral" @title={{t "favorites.loading"}} />
          </StationSectionCard>
        {{else if this.settings.favoritesCompactList}}
          <div
            class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(14rem,calc(50%-0.375rem)),1fr))]"
            data-test-favorites-stations-compact
          >
            {{#each this.stations as |station|}}
              <StationCompactCard @station={{station}} />
            {{/each}}
          </div>
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
      </div>
    </section>
  </template>
}
