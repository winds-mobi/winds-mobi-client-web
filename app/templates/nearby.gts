import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { pageTitle } from 'ember-page-title';
import { action } from '@ember/object';
import { Button } from '@frontile/buttons';
import { t } from 'ember-intl';
import type { IntlService } from 'ember-intl';
import { nearbyQuery } from 'winds-mobi-client-web/builders/station';
import commitResolvedStations from 'winds-mobi-client-web/modifiers/commit-resolved-stations';
import registerLoadingProbe from 'winds-mobi-client-web/modifiers/register-loading-probe';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';
import StationNearbyCard from 'winds-mobi-client-web/components/station/nearby-card';
import StationCompactCard from 'winds-mobi-client-web/components/station/compact-card';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type {
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store';
import { responseData } from 'winds-mobi-client-web/utils/request-response';
import { locationErrorTranslationKey } from 'winds-mobi-client-web/utils/location-error-translation-key';

interface NearbyTemplateSignature {
  Args: {
    model: unknown;
  };
}

const NEARBY_LIMIT = 10;

export default class NearbyTemplate extends Component<NearbyTemplateSignature> {
  @service declare intl: IntlService;
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;
  @service declare mapRefresh: MapRefreshService;
  @service declare settings: SettingsService;
  @service declare store: StoreService;

  // Recreated when the located coordinates change or the shared refresh tick fires
  // — touching `lastRefresh` makes each tick refetch. No `backgroundReload`, so a
  // reload is a real pending request that `loadingProbe` (and the navbar spinner)
  // reflects; the latch keeps the previous cards on screen meanwhile.
  @cached
  get stationsRequest(): Future<{ data: Station[] }> | undefined {
    const coordinates = this.nearbyLocation.coordinates;

    if (!coordinates) {
      return undefined;
    }

    // Read so each refresh tick invalidates this getter and refetches.
    void this.mapRefresh.lastRefresh;

    return this.store.request<{ data: Station[] }>(
      nearbyQuery<Station>(
        'station',
        coordinates.latitude,
        coordinates.longitude,
        NEARBY_LIMIT
      )
    );
  }

  get requestState() {
    return this.stationsRequest
      ? getRequestState(this.stationsRequest)
      : undefined;
  }

  // Last successfully-loaded stations, committed by `commitResolvedStations` on
  // each resolve, so the cards stay on screen while a refresh tick reloads.
  @tracked private lastStations: Station[] = [];

  commitStations = (stations: Station[]) => {
    this.lastStations = stations;
  };

  get stations(): Station[] {
    return this.requestState?.isSuccess
      ? responseData(this.requestState.value)
      : this.lastStations;
  }

  // Reports to the shared refresh service whether nearby is currently loading, so
  // the navbar refresh control spins while this request is in flight.
  loadingProbe = (): boolean => {
    return this.requestState?.isPending === true;
  };

  // True only on the first load, when there are no previous cards to keep; later
  // refreshes keep the cards on screen and spin the navbar control instead.
  get isInitialLoad(): boolean {
    return this.loadingProbe() && this.lastStations.length === 0;
  }

  get isError(): boolean {
    return this.requestState?.isError === true;
  }

  get locationMessage() {
    if (this.nearbyLocation.isRequestingLocation) {
      return this.intl.t('nearby.location.locatingDescription');
    }

    const errorKey = locationErrorTranslationKey(
      'nearby.location',
      this.nearbyLocation.errorCode
    );

    if (errorKey) {
      return this.intl.t(errorKey);
    }

    return this.intl.t('nearby.description');
  }

  get shouldShowLocationPrompt() {
    return (
      !this.nearbyLocation.hasCoordinates &&
      !this.nearbyLocation.isCheckingPermission
    );
  }

  get isLocationButtonDisabled() {
    return !this.nearbyLocation.canRequestLocation;
  }

  @action
  async requestLocation() {
    await this.nearbyLocation.requestCurrentPosition();
  }

  <template>
    {{pageTitle (t "nearby.title")}}

    <section
      class="min-h-0 flex-1 overflow-y-auto bg-slate-200"
      {{commitResolvedStations this.requestState this.commitStations}}
      {{registerLoadingProbe this.mapRefresh this.loadingProbe}}
    >
      <div class="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {{#if this.nearbyLocation.hasCoordinates}}
          {{#if this.isError}}
            <StationSectionCard
              data-test-nearby-loading
              @title={{t "nearby.title"}}
              @titleClass="text-rose-700"
            >
              <p class="py-10 text-center text-sm font-medium text-rose-700">
                {{t "nearby.requestError"}}
              </p>
            </StationSectionCard>
          {{else if this.isInitialLoad}}
            <StationSectionCard
              data-test-nearby-loading
              @title={{t "nearby.title"}}
            >
              <p class="py-10 text-center text-sm font-medium text-slate-500">
                {{t "nearby.loading"}}
              </p>
            </StationSectionCard>
          {{else if this.settings.nearbyCompactList}}
            <div
              class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(14rem,calc(50%-0.375rem)),1fr))]"
              data-test-nearby-stations-compact
            >
              {{#each this.stations as |station|}}
                <StationCompactCard @station={{station}} />
              {{/each}}
            </div>
          {{else}}
            <div
              class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(22rem,1fr))]"
              data-test-nearby-stations
            >
              {{#each this.stations as |station|}}
                <StationNearbyCard @station={{station}} />
              {{/each}}
            </div>
          {{/if}}
        {{else if this.shouldShowLocationPrompt}}
          <StationSectionCard
            data-test-nearby-location-prompt
            @title={{t "nearby.title"}}
          >
            <div class="max-w-2xl">
              <p class="text-sm leading-6 text-slate-600">
                {{this.locationMessage}}
              </p>
              <div class="mt-4">
                <Button
                  data-test-nearby-location-button
                  disabled={{this.isLocationButtonDisabled}}
                  @intent="primary"
                  @onPress={{this.requestLocation}}
                >
                  {{t "nearby.location.cta"}}
                </Button>
              </div>
            </div>
          </StationSectionCard>
        {{else}}
          <StationSectionCard
            data-test-nearby-permission-check
            @title={{t "nearby.title"}}
          >
            <p class="py-10 text-center text-sm font-medium text-slate-500">
              {{t "nearby.location.checking"}}
            </p>
          </StationSectionCard>
        {{/if}}
      </div>
    </section>
  </template>
}
