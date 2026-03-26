import Component from '@glimmer/component';
import { hash } from '@ember/helper';
import { on } from '@ember/modifier';
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
  Args: {
    layout?: 'desktop' | 'drawer';
    onNavigate?: () => void;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const ACTIVE_LINK_CLASS = 'border-slate-900 text-slate-950';
const INACTIVE_LINK_CLASS =
  'border-transparent text-slate-500 hover:text-slate-900';
const BASE_LINK_CLASS = 'border-b-2 px-2 py-1 text-sm font-medium transition';
const DRAWER_ACTIVE_LINK_CLASS = 'bg-slate-900 text-white';
const DRAWER_INACTIVE_LINK_CLASS =
  'text-slate-700 hover:bg-slate-100 hover:text-slate-950';
const DRAWER_BASE_LINK_CLASS =
  'rounded-md px-3 py-2 text-sm font-medium transition';
const NOOP = () => {};

export default class NavbarRouteSwitch extends Component<NavbarRouteSwitchSignature> {
  @service declare router: RouterService;

  get isDrawerLayout() {
    return this.args.layout === 'drawer';
  }

  get onNavigate() {
    return this.args.onNavigate ?? NOOP;
  }

  get isMapRoute() {
    return this.router.currentRouteName?.startsWith('map') ?? false;
  }

  get isNearbyRoute() {
    return this.router.currentRouteName === 'nearby';
  }

  get isHelpRoute() {
    return this.router.currentRouteName === 'help';
  }

  get mapLinkClass() {
    return `${this.baseLinkClass} ${
      this.isMapRoute ? this.activeLinkClass : this.inactiveLinkClass
    }`;
  }

  get nearbyLinkClass() {
    return `${this.baseLinkClass} ${
      this.isNearbyRoute ? this.activeLinkClass : this.inactiveLinkClass
    }`;
  }

  get helpLinkClass() {
    return `${this.baseLinkClass} ${
      this.isHelpRoute ? this.activeLinkClass : this.inactiveLinkClass
    }`;
  }

  get wrapperClass() {
    return this.isDrawerLayout
      ? 'w-full'
      : 'flex flex-1 justify-center px-3 sm:px-6';
  }

  get containerClass() {
    return this.isDrawerLayout
      ? 'flex flex-col items-stretch gap-2'
      : 'inline-flex items-center gap-4';
  }

  get baseLinkClass() {
    return this.isDrawerLayout ? DRAWER_BASE_LINK_CLASS : BASE_LINK_CLASS;
  }

  get activeLinkClass() {
    return this.isDrawerLayout ? DRAWER_ACTIVE_LINK_CLASS : ACTIVE_LINK_CLASS;
  }

  get inactiveLinkClass() {
    return this.isDrawerLayout
      ? DRAWER_INACTIVE_LINK_CLASS
      : INACTIVE_LINK_CLASS;
  }

  <template>
    <div class={{this.wrapperClass}}>
      <div class={{this.containerClass}}>
        <LinkTo
          @route="map"
          @query={{hash
            mapLat=DEFAULT_MAP_LAT
            mapLng=DEFAULT_MAP_LNG
            mapZoom=DEFAULT_MAP_ZOOM
          }}
          class={{this.mapLinkClass}}
          data-test-navbar-map-link
          {{on "click" this.onNavigate}}
        >
          {{t "navigation.map"}}
        </LinkTo>

        <LinkTo
          @route="nearby"
          class={{this.nearbyLinkClass}}
          data-test-navbar-nearby-link
          {{on "click" this.onNavigate}}
        >
          {{t "navigation.nearby"}}
        </LinkTo>

        <LinkTo
          @route="help"
          class={{this.helpLinkClass}}
          data-test-navbar-help-link
          {{on "click" this.onNavigate}}
        >
          {{t "navigation.help"}}
        </LinkTo>
      </div>
    </div>
  </template>
}
