/* eslint-disable @typescript-eslint/no-empty-object-type */
import Component from '@glimmer/component';
import NavbarLogo from './logo';
import NavbarRefresh from './refresh';
import NavbarRouteSwitch from './route-switch';
// import NavbarNotifications from './notifications';
// import NavbarUserMenu from './user-menu';
// import NavbarMobileMenu from './mobile-menu';

export interface NavbarSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class Navbar extends Component<NavbarSignature> {
  <template>
    <nav
      class="border-b border-slate-200 bg-white shadow-md shadow-slate-900/12"
    >
      <div class="px-2 sm:px-4 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <NavbarLogo />
          <NavbarRouteSwitch />

          {{! TODO: <NavbarMobileMenu::Button /> }}
          <div class="ml-4 flex items-center">
            <NavbarRefresh />

            {{! <NavbarNotifications /> }}

            {{! <NavbarUserMenu /> }}
          </div>
        </div>
      </div>

      {{! <NavbarMobileMenu /> }}
    </nav>
  </template>
}
