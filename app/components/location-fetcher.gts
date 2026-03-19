/* eslint-disable @typescript-eslint/no-empty-object-type */
import Component from '@glimmer/component';
import Gps from 'ember-phosphor-icons/components/ph-gps';
import GpsFix from 'ember-phosphor-icons/components/ph-gps-fix';
import GpsSlash from 'ember-phosphor-icons/components/ph-gps-slash';
import { ToggleButton } from '@frontile/buttons';
import { t } from 'ember-intl';
import type LocationService from 'winds-mobi-client-web/services/location';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { action } from '@ember/object';
import {
  isMapRoute,
  parseMapView,
  serializeMapView,
  type MapQueryParams,
} from 'winds-mobi-client-web/utils/map-view';

export interface LocationFetcherSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class LocationFetcher extends Component<LocationFetcherSignature> {
  @service declare location: LocationService;
  @service declare router: RouterService;

  @action async centerOnGps() {
    await this.location.getLocationFromGps.perform();

    if (!this.location.gps || !isMapRoute(this.router.currentRouteName)) {
      return;
    }

    const currentView = parseMapView(
      this.router.currentRoute?.queryParams as MapQueryParams | undefined
    );

    await this.router.replaceWith({
      queryParams: serializeMapView({
        longitude: this.location.gps.longitude,
        latitude: this.location.gps.latitude,
        zoom: currentView.zoom,
      }),
    });
  }

  <template>
    <ToggleButton
      type="button"
      @onChange={{this.centerOnGps}}
      @isSelected={{if this.location.getLocationFromGps.last.value true false}}
      disabled={{this.location.getLocationFromGps.isRunning}}
      class="flex align-middle items-center gap-2"
    >
      {{#if this.location.getLocationFromGps.last.value}}
        <GpsFix />
      {{else}}
        {{#if this.location.getLocationFromGps.last.isError}}
          <GpsSlash />
        {{else}}
          <Gps
            class={{if
              this.location.getLocationFromGps.isRunning
              "animate-pulse"
            }}
          />
        {{/if}}
      {{/if}}

      <span class="hidden lg:inline">
        {{t "location-fetcher.center"}}
      </span>
    </ToggleButton>
  </template>
}
