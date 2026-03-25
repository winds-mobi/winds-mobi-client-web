import Component from '@glimmer/component';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import NavbarLocationControl from './location-control';
import { isMapRoute } from 'winds-mobi-client-web/utils/map-view';

export interface NavbarLocationSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class NavbarLocation extends Component<NavbarLocationSignature> {
  @service declare router: RouterService;

  get isVisible() {
    return (
      isMapRoute(this.router.currentRouteName) ||
      this.router.currentRouteName === 'nearby'
    );
  }

  <template>
    {{#if this.isVisible}}
      <NavbarLocationControl />
    {{/if}}
  </template>
}
