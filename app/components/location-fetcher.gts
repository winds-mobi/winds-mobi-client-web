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
      class="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 disabled:cursor-wait disabled:opacity-70 aria-[pressed=true]:border-slate-900 aria-[pressed=true]:bg-slate-900 aria-[pressed=true]:text-white"
    >
      {{#if this.location.getLocationFromGps.last.value}}
        <GpsFix class="shrink-0" />
      {{else}}
        {{#if this.location.getLocationFromGps.last.isError}}
          <GpsSlash class="shrink-0" />
        {{else}}
          <Gps
            class="shrink-0
              {{if this.location.getLocationFromGps.isRunning 'animate-pulse'}}"
          />
        {{/if}}
      {{/if}}

      <span class="hidden whitespace-nowrap lg:inline">
        {{t "location-fetcher.center"}}
      </span>
    </ToggleButton>
  </template>
}
