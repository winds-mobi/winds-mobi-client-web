/* eslint-disable @typescript-eslint/no-empty-object-type */
import Component from '@glimmer/component';
import { service } from '@ember/service';
import activateMapRefresh from 'winds-mobi-client-web/modifiers/activate-map-refresh';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import NavbarLogo from './logo';
import NavbarMenuDesktop from './menu/desktop';
import NavbarMenuMobile from './menu/mobile';

export interface NavbarSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class Navbar extends Component<NavbarSignature> {
  @service declare mapRefresh: MapRefreshService;

  <template>
    <nav
      class="border-b border-slate-200 bg-white shadow-md shadow-slate-900/12"
      {{activateMapRefresh this.mapRefresh}}
    >
      <div class="px-2.5">
        <div class="flex h-16 items-center gap-3">
          <NavbarLogo />

          <NavbarMenuDesktop />

          <div class="ml-auto md:hidden">
            <NavbarMenuMobile />
          </div>
        </div>
      </div>
    </nav>
  </template>
}
