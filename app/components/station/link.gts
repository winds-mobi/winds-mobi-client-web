import Component from '@glimmer/component';
import { service } from '@ember/service';
import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import type RouterService from '@ember/routing/router-service';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';

export interface StationLinkSignature {
  Args: {
    station: Station;
  };
  Element: HTMLAnchorElement;
}

// A station's name, opening it on the map at the shared focus zoom (see
// `focusQueryParamsFor`). Callers style it through `class`.
export default class StationLink extends Component<StationLinkSignature> {
  @service declare router: RouterService;

  // `currentRouteName` is only ever null before the router's first
  // transition, long before any station link can exist to render this --
  // asserted non-null since `LinkTo`'s `@route` needs a plain `string`, not
  // the `| null` the service's own type carries.
  get currentRouteName(): string {
    return this.router.currentRouteName!;
  }

  // Stays on whichever surface (all/favourites/hidden) is already showing
  // this station -- opening it only ever adds query params to the current
  // route, never a navigation elsewhere (see app/utils/station-detail.ts).
  get queryParams() {
    return {
      ...focusQueryParamsFor(this.args.station),
      station: this.args.station.id,
    };
  }

  <template>
    <LinkTo
      data-test-station-title
      @route={{this.currentRouteName}}
      @query={{this.queryParams}}
      title={{t "station.showOnMap"}}
      ...attributes
    >
      {{@station.name}}
    </LinkTo>
  </template>
}
