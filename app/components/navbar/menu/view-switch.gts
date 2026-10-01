import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { SegmentedControl } from 'frontile/buttons';
import { t } from 'ember-intl';
import Cards from 'ember-phosphor-icons/components/ph-cards';
import GridNine from 'ember-phosphor-icons/components/ph-grid-nine';
import MapTrifold from 'ember-phosphor-icons/components/ph-map-trifold';
import onRouteChange from 'winds-mobi-client-web/modifiers/on-route-change';
import type StationViewService from 'winds-mobi-client-web/services/station-view';
import type {
  StationListSurface,
  StationViewMode,
} from 'winds-mobi-client-web/services/station-view';
import { surfaceForRoute } from './items';

export interface NavbarMenuViewSwitchSignature {
  Args: {
    variant: 'desktop' | 'mobile';
  };
  Element: null;
}

// The second group in the navbar: how the current surface's stations are
// drawn, beside the links that choose which stations those are. Renders
// nothing on routes that show no station list (Settings, Help), so the two
// groups always read as "what am I looking at" and "how".
export default class NavbarMenuViewSwitch extends Component<NavbarMenuViewSwitchSignature> {
  @service declare router: RouterService;
  @service('station-view') declare stationView: StationViewService;

  // `currentRouteName` isn't tracked, so the route name is latched from the
  // same `routeDidChange` event the rest of the navbar listens to, and read
  // live until the first one lands (the same shape as `TrackedMapView`).
  @tracked private routeName: string | null = null;

  get surface(): StationListSurface | undefined {
    return surfaceForRoute(this.routeName ?? this.router.currentRouteName);
  }

  @action
  handleRouteChange() {
    this.routeName = this.router.currentRouteName;
  }

  get isMobile(): boolean {
    return this.args.variant === 'mobile';
  }

  get mode(): StationViewMode | undefined {
    return this.surface ? this.stationView.modeFor(this.surface) : undefined;
  }

  @action
  handleChange(mode: StationViewMode) {
    this.stationView.setMode(mode);
  }

  <template>
    <div {{onRouteChange this.router this.handleRouteChange}}>
      {{#if this.surface}}
        <SegmentedControl
          aria-label={{t "station.view.label"}}
          data-test-navbar-view-switch={{this.surface}}
          @size="sm"
          @color="primary"
          @isFullWidth={{this.isMobile}}
          @value={{this.mode}}
          @onChange={{this.handleChange}}
          as |c|
        >
          <c.Item
            aria-label={{t "station.view.map"}}
            data-test-navbar-view-option="map"
            @value="map"
          >
            <MapTrifold @size={{16}} />
          </c.Item>
          <c.Item
            aria-label={{t "station.view.cards"}}
            data-test-navbar-view-option="cards"
            @value="cards"
          >
            <Cards @size={{16}} />
          </c.Item>
          <c.Item
            aria-label={{t "station.view.compact"}}
            data-test-navbar-view-option="compact"
            @value="compact"
          >
            <GridNine @size={{16}} />
          </c.Item>
        </SegmentedControl>
      {{/if}}
    </div>
  </template>
}
