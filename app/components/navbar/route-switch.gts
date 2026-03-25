import Component from '@glimmer/component';
import { hash } from '@ember/helper';
import { LinkTo } from '@ember/routing';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { t } from 'ember-intl';
import {
  DEFAULT_MAP_LAT,
  DEFAULT_MAP_LNG,
  DEFAULT_MAP_ZOOM,
} from 'winds-mobi-client-web/utils/map-view';

export interface NavbarRouteSwitchSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

const ACTIVE_LINK_CLASS =
  'border-slate-900 text-slate-950';
const INACTIVE_LINK_CLASS =
  'border-transparent text-slate-500 hover:text-slate-900';
const BASE_LINK_CLASS =
  'border-b-2 px-2 py-1 text-sm font-medium transition';

export default class NavbarRouteSwitch extends Component<NavbarRouteSwitchSignature> {
  @service declare router: RouterService;

  get isMapRoute() {
    return this.router.currentRouteName?.startsWith('map') ?? false;
  }

  get isNearbyRoute() {
    return this.router.currentRouteName === 'nearby';
  }

  get mapLinkClass() {
    return `${BASE_LINK_CLASS} ${
      this.isMapRoute ? ACTIVE_LINK_CLASS : INACTIVE_LINK_CLASS
    }`;
  }

  get nearbyLinkClass() {
    return `${BASE_LINK_CLASS} ${
      this.isNearbyRoute ? ACTIVE_LINK_CLASS : INACTIVE_LINK_CLASS
    }`;
  }

  <template>
    <div class="flex flex-1 justify-center px-3 sm:px-6">
      <div class="inline-flex items-center gap-4">
        <LinkTo
          @route="map"
          @query={{hash
            mapLat=DEFAULT_MAP_LAT
            mapLng=DEFAULT_MAP_LNG
            mapZoom=DEFAULT_MAP_ZOOM
          }}
          class={{this.mapLinkClass}}
          data-test-navbar-map-link
        >
          {{t "navigation.map"}}
        </LinkTo>

        <LinkTo
          @route="nearby"
          class={{this.nearbyLinkClass}}
          data-test-navbar-nearby-link
        >
          {{t "navigation.nearby"}}
        </LinkTo>
      </div>
    </div>
  </template>
}
