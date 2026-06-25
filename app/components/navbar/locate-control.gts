import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { Button } from '@frontile/buttons';
import { t } from 'ember-intl';
import CrosshairSimple from 'ember-phosphor-icons/components/ph-crosshair-simple';
import type RouterService from '@ember/routing/router-service';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import { requestAndFly } from 'winds-mobi-client-web/utils/locate';

export interface NavbarLocateControlSignature {
  Element: HTMLButtonElement;
}

export default class NavbarLocateControl extends Component<NavbarLocateControlSignature> {
  @service declare router: RouterService;
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;

  get isDisabled() {
    return (
      this.nearbyLocation.isCheckingPermission ||
      !this.nearbyLocation.canRequestLocation
    );
  }

  get isLocated() {
    return this.nearbyLocation.hasCoordinates && !this.nearbyLocation.errorCode;
  }

  @action
  async locate() {
    await requestAndFly(this.nearbyLocation, this.router);
  }

  <template>
    <Button
      aria-label={{t "map.locate.ariaLabel"}}
      data-test-navbar-locate
      disabled={{this.isDisabled}}
      @appearance="outlined"
      @intent={{if this.isLocated "primary" undefined}}
      @onPress={{this.locate}}
      class="h-12"
      ...attributes
    >
      <CrosshairSimple
        @weight={{if this.isLocated "fill"}}
        class={{if this.nearbyLocation.isRequestingLocation "animate-spin"}}
      />
    </Button>
  </template>
}
