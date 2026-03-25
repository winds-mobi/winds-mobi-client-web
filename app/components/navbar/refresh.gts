import Component from '@glimmer/component';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import NavbarRefreshControl from './refresh-control';
import { isMapRoute } from 'winds-mobi-client-web/utils/map-view';

export interface NavbarRefreshSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class NavbarRefresh extends Component<NavbarRefreshSignature> {
  @service declare router: RouterService;

  get isVisible() {
    return (
      isMapRoute(this.router.currentRouteName) ||
      this.router.currentRouteName === 'nearby'
    );
  }

  <template>
    {{#if this.isVisible}}
      <NavbarRefreshControl />
    {{/if}}
  </template>
}
