import Component from '@glimmer/component';
import { action } from '@ember/object';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { Request } from '@warp-drive/ember';
import { Button } from '@frontile/buttons';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import { nearbyQuery } from 'winds-mobi-client-web/builders/station';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';
import StationNearbyCard from 'winds-mobi-client-web/components/station/nearby-card';
import type { IntlService } from 'ember-intl';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type { Station } from 'winds-mobi-client-web/services/store.js';

interface NearbyTemplateSignature {
  Args: {
    model: unknown;
  };
}

type RequestStore = {
  request<T>(request: unknown): Future<T>;
};

export default class NearbyTemplate extends Component<NearbyTemplateSignature> {
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;
  @service declare intl: IntlService;
  @service declare mapRefresh: MapRefreshService;
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;

  private get requestStore(): RequestStore {
    return this.store as unknown as RequestStore;
  }

  @cached
  get stationsRequest(): Future<{ data: Station[] }> | undefined {
    const coordinates = this.nearbyLocation.coordinates;

    if (!coordinates) {
      return undefined;
    }

    this.mapRefresh.lastRefresh;

    return this.requestStore.request<{ data: Station[] }>(
      nearbyQuery<Station>(
        'station',
        coordinates.latitude,
        coordinates.longitude,
        10,
        {
          backgroundReload: true,
        }
      )
    );
  }

  get buttonLabel() {
    if (this.nearbyLocation.isRequestingLocation) {
      return String(this.intl.t('nearby.location.locating'));
    }

    if (this.nearbyLocation.errorCode) {
      return String(this.intl.t('nearby.location.retry'));
    }

    return String(this.intl.t('nearby.location.enable'));
  }

  get locationMessage() {
    switch (this.nearbyLocation.errorCode) {
      case 'permission-denied':
        return String(this.intl.t('nearby.location.permissionDenied'));
      case 'position-unavailable':
        return String(this.intl.t('nearby.location.positionUnavailable'));
      case 'timeout':
        return String(this.intl.t('nearby.location.timeout'));
      case 'unsupported':
        return String(this.intl.t('nearby.location.unsupported'));
      case 'unknown':
        return String(this.intl.t('nearby.location.unknownError'));
      default:
        return String(this.intl.t('nearby.description'));
    }
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
  enableLocation() {
    void this.nearbyLocation.requestCurrentPosition();
  }

  <template>
    {{pageTitle (t "nearby.title")}}

    <section class="min-h-0 flex-1 overflow-y-auto bg-slate-200">
      <div class="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {{#if this.nearbyLocation.hasCoordinates}}
          <Request @request={{this.stationsRequest}}>
            <:content as |result|>
              <div
                class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(22rem,1fr))]"
                data-test-nearby-stations
              >
                {{#each result.data as |station|}}
                  <StationNearbyCard @station={{station}} />
                {{/each}}
              </div>
            </:content>

            <:loading>
              <StationSectionCard
                data-test-nearby-loading
                @title={{t "nearby.title"}}
              >
                <p class="py-10 text-center text-sm font-medium text-slate-500">
                  {{t "nearby.loading"}}
                </p>
              </StationSectionCard>
            </:loading>

            <:error>
              <StationSectionCard
                data-test-nearby-loading
                @title={{t "nearby.title"}}
                @titleClass="text-rose-700"
              >
                <p class="py-10 text-center text-sm font-medium text-rose-700">
                  {{t "nearby.requestError"}}
                </p>
              </StationSectionCard>
            </:error>
          </Request>
        {{else if this.shouldShowLocationPrompt}}
          <StationSectionCard
            data-test-nearby-location-prompt
            @title={{t "nearby.title"}}
          >
            <div class="max-w-2xl">
              <p class="text-sm leading-6 text-slate-600">
                {{this.locationMessage}}
              </p>
              <div class="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  @appearance="outlined"
                  @onPress={{this.enableLocation}}
                  disabled={{this.isLocationButtonDisabled}}
                  data-test-nearby-enable-location
                >
                  {{this.buttonLabel}}
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
