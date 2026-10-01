import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { Request } from '@warp-drive/ember';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import { Alert } from 'frontile/status';
import { byIdsQuery } from 'winds-mobi-client-web/builders/station';
import StationNearbyCard from 'winds-mobi-client-web/components/station/nearby-card';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';
import commitResolvedStations from 'winds-mobi-client-web/modifiers/commit-resolved-stations';
import type HiddenStationsService from 'winds-mobi-client-web/services/hidden-stations';
import type {
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store';

interface HiddenTemplateSignature {
  Args: {
    model: unknown;
  };
}

// The stations the visitor has hidden (#167), with their live readings and an
// unhide button on each card. Deliberately not in the navbar -- it's reached
// from the hidden-stations box at the bottom of Settings. Same shape as the
// favourites page (app/templates/favorites.gts).
export default class HiddenTemplate extends Component<HiddenTemplateSignature> {
  @service('hidden-stations') declare hiddenStations: HiddenStationsService;
  @service declare store: StoreService;

  get hiddenIds(): string[] {
    return this.hiddenStations.stationIds;
  }

  // Recreated when the hidden ids change; refreshed in place, same as the
  // favourites page.
  @cached
  get stationsRequest(): Future<{ data: Station[] }> | undefined {
    const ids = this.hiddenIds;

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

  // Last successfully-loaded stations, committed by `commitResolvedStations`
  // on each resolve, so the cards stay on screen while a refresh reloads.
  @tracked private lastStations: Station[] = [];

  commitStations = (stations: Station[]) => {
    this.lastStations = stations;
  };

  get stations(): Station[] {
    const stations = this.lastStations;

    // The API doesn't guarantee response order — present in the order they
    // were hidden.
    const order = new Map(this.hiddenIds.map((id, index) => [id, index]));

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

  get hasNoHidden(): boolean {
    return this.hiddenIds.length === 0;
  }

  <template>
    {{pageTitle (t "hidden.title")}}

    <section class="min-h-0 flex-1 overflow-y-auto bg-slate-200">
      <Request
        @request={{this.stationsRequest}}
        @autorefresh="invalid"
        @autorefreshBehavior="refresh"
      >
        <:content as |result|>
          <div
            class="contents"
            {{commitResolvedStations result.data this.commitStations}}
          ></div>
        </:content>
        <:idle></:idle>
        <:loading></:loading>
        <:error></:error>
      </Request>
      <div class="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {{#if this.isError}}
          <StationSectionCard
            data-test-hidden-error
            @title={{t "hidden.title"}}
            @titleClass="text-rose-700"
          >
            <Alert @status="danger" @title={{t "hidden.requestError"}} />
          </StationSectionCard>
        {{else if this.hasNoHidden}}
          <StationSectionCard
            data-test-hidden-empty
            @title={{t "hidden.title"}}
          >
            <Alert
              @status="neutral"
              @title={{t "hidden.emptyTitle"}}
              @description={{t "hidden.emptyDescription"}}
            />
          </StationSectionCard>
        {{else if this.isInitialLoad}}
          <StationSectionCard
            data-test-hidden-loading
            @title={{t "hidden.title"}}
          >
            <Alert @status="neutral" @title={{t "hidden.loading"}} />
          </StationSectionCard>
        {{else}}
          <div
            class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(22rem,1fr))]"
            data-test-hidden-stations
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
