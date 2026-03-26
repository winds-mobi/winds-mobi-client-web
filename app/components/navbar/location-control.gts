import Component from '@glimmer/component';
import { action } from '@ember/object';
import type RouterService from '@ember/routing/router-service';
import { service } from '@ember/service';
import { Button } from '@frontile/buttons';
import type { IntlService } from 'ember-intl';
import Gps from 'ember-phosphor-icons/components/ph-gps';
import GpsFix from 'ember-phosphor-icons/components/ph-gps-fix';
import GpsSlash from 'ember-phosphor-icons/components/ph-gps-slash';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import { locationErrorTranslationKey } from 'winds-mobi-client-web/utils/location-error-translation-key';
import {
  isMapRoute,
  parseMapView,
  serializeMapView,
  type MapQueryParams,
} from 'winds-mobi-client-web/utils/map-view';

export interface NavbarLocationControlSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class NavbarLocationControl extends Component<NavbarLocationControlSignature> {
  @service declare intl: IntlService;
  @service declare router: RouterService;
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;

  get title() {
    if (this.nearbyLocation.isRequestingLocation) {
      return String(this.intl.t('location.locating'));
    }

    const errorKey = locationErrorTranslationKey(
      'location',
      this.nearbyLocation.errorCode
    );

    if (errorKey) {
      return String(this.intl.t(errorKey));
    }

    if (this.nearbyLocation.hasCoordinates) {
      return String(this.intl.t('location.ready'));
    }

    return String(this.intl.t('location.locate'));
  }

  get buttonClass() {
    if (this.nearbyLocation.isRequestingLocation) {
      return 'text-orange-500';
    }

    if (this.nearbyLocation.errorCode) {
      return 'text-slate-400';
    }

    if (this.nearbyLocation.hasCoordinates) {
      return 'text-sky-600';
    }

    return 'text-slate-400';
  }

  get isDisabled() {
    return !this.nearbyLocation.canRequestLocation;
  }

  get mapView() {
    return parseMapView(
      this.router.currentRoute?.queryParams as MapQueryParams | undefined
    );
  }

  @action
  async locateMe() {
    await this.nearbyLocation.requestCurrentPosition();

    const coordinates = this.nearbyLocation.coordinates;

    if (!coordinates || !isMapRoute(this.router.currentRouteName)) {
      return;
    }

    this.router.replaceWith({
      queryParams: serializeMapView({
        ...this.mapView,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        zoom: Math.max(this.mapView.zoom, 12),
      }),
    });
  }

  <template>
    <Button
      aria-busy={{this.nearbyLocation.isRequestingLocation}}
      aria-label={{this.title}}
      data-test-navbar-location
      disabled={{this.isDisabled}}
      @appearance="outlined"
      @class="px-2.5"
      title={{this.title}}
      @onPress={{this.locateMe}}
    >
      {{#if this.nearbyLocation.isRequestingLocation}}
        <Gps
          @size={{18}}
          class="animate-pulse transition {{this.buttonClass}}"
        />
      {{else if this.nearbyLocation.errorCode}}
        <GpsSlash @size={{18}} class="transition {{this.buttonClass}}" />
      {{else if this.nearbyLocation.hasCoordinates}}
        <GpsFix @size={{18}} class="transition {{this.buttonClass}}" />
      {{else}}
        <Gps @size={{18}} class="transition {{this.buttonClass}}" />
      {{/if}}
    </Button>
  </template>
}
