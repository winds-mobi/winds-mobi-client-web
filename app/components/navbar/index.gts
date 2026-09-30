import Component from '@glimmer/component';
import { service } from '@ember/service';
import activateRefresh from 'winds-mobi-client-web/modifiers/activate-refresh';
import type RefreshService from 'winds-mobi-client-web/services/refresh';
import NavbarLogo from './logo';
import NavbarSearch from './search';
import NavbarLocateControl from './locate-control';
import NavbarRefreshControl from './refresh-control';
import NavbarMenuDesktop from './menu/desktop';
import NavbarMenuMobile from './menu/mobile';

export interface NavbarSignature {
  Args: Record<string, never>;
  Element: null;
}

export default class Navbar extends Component<NavbarSignature> {
  @service declare refresh: RefreshService;

  <template>
    <nav
      class="border-b border-slate-200 bg-white shadow-md shadow-slate-900/12"
      {{activateRefresh this.refresh}}
    >
      <div class="px-2.5">
        <div class="flex h-16 items-center gap-2 md:gap-3">
          <NavbarLogo />

          {{! Desktop: navigation centered between the logo and the right group. }}
          <div class="flex flex-1 justify-center">
            <NavbarMenuDesktop />
          </div>

          <NavbarSearch data-test-navbar-search="navbar" />

          <NavbarLocateControl />
          <NavbarRefreshControl />

          <NavbarMenuMobile />
        </div>
      </div>
    </nav>
  </template>
}
