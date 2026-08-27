import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import { alarmsQuery } from 'winds-mobi-client-web/builders/station';
import StationCompactCard from 'winds-mobi-client-web/components/station/compact-card';
import StationNearbyCard from 'winds-mobi-client-web/components/station/nearby-card';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';
import commitResolvedStations from 'winds-mobi-client-web/modifiers/commit-resolved-stations';
import registerLoadingProbe from 'winds-mobi-client-web/modifiers/register-loading-probe';
import type AlarmsService from 'winds-mobi-client-web/services/alarms';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type {
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store';
import { responseData } from 'winds-mobi-client-web/utils/request-response';

interface AlarmsTemplateSignature {
  Args: {
    model: unknown;
  };
}

export default class AlarmsTemplate extends Component<AlarmsTemplateSignature> {
  @service declare alarms: AlarmsService;
  @service declare mapRefresh: MapRefreshService;
  @service declare settings: SettingsService;
  @service declare store: StoreService;

  get alarmedIds(): string[] {
    return Object.keys(this.alarms.configs);
  }

  // Same shape as the favourites view: no `backgroundReload`, the latch
  // below keeps the previous cards on screen while a reload is in flight.
  @cached
  get stationsRequest(): Future<{ data: Station[] }> | undefined {
    const ids = this.alarmedIds;

    if (ids.length === 0) {
      return undefined;
    }

    // Read so each refresh tick invalidates this getter and refetches.
    void this.mapRefresh.lastRefresh;

    return this.store.request<{ data: Station[] }>(
      alarmsQuery<Station>('station', ids)
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

    // The API doesn't guarantee response order — present in the order
    // alarms were added.
    const order = new Map(this.alarmedIds.map((id, index) => [id, index]));

    return [...stations].sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    );
  }

  // Reports to the shared refresh service whether this view is loading, so
  // the navbar refresh control spins while the request is in flight.
  loadingProbe = (): boolean => {
    return this.requestState?.isPending === true;
  };

  get isInitialLoad(): boolean {
    return this.loadingProbe() && this.lastStations.length === 0;
  }

  get isError(): boolean {
    return this.requestState?.isError === true;
  }

  get hasNoAlarms(): boolean {
    return this.alarmedIds.length === 0;
  }

  <template>
    {{pageTitle (t "alarms.title")}}

    <section
      class="min-h-0 flex-1 overflow-y-auto bg-slate-200"
      {{commitResolvedStations this.requestState this.commitStations}}
      {{registerLoadingProbe this.mapRefresh this.loadingProbe}}
    >
      <div class="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {{#if this.isError}}
          <StationSectionCard
            data-test-alarms-error
            @title={{t "alarms.title"}}
            @titleClass="text-rose-700"
          >
            <p class="py-10 text-center text-sm font-medium text-rose-700">
              {{t "alarms.requestError"}}
            </p>
          </StationSectionCard>
        {{else if this.hasNoAlarms}}
          <StationSectionCard
            data-test-alarms-empty
            @title={{t "alarms.title"}}
          >
            <p class="py-10 text-center text-sm font-medium text-slate-500">
              {{t "alarms.empty"}}
            </p>
          </StationSectionCard>
        {{else if this.isInitialLoad}}
          <StationSectionCard
            data-test-alarms-loading
            @title={{t "alarms.title"}}
          >
            <p class="py-10 text-center text-sm font-medium text-slate-500">
              {{t "alarms.loading"}}
            </p>
          </StationSectionCard>
        {{else if this.settings.alarmsCompactList}}
          <div
            class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(14rem,calc(50%-0.375rem)),1fr))]"
            data-test-alarms-stations-compact
          >
            {{#each this.stations as |station|}}
              <StationCompactCard @station={{station}} />
            {{/each}}
          </div>
        {{else}}
          <div
            class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(22rem,1fr))]"
            data-test-alarms-stations
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
