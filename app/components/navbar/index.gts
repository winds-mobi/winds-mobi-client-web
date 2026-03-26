/* eslint-disable @typescript-eslint/no-empty-object-type */
import Component from '@glimmer/component';
import NavbarDesktopMenu from './desktop-menu';
import NavbarLogo from './logo';
import NavbarMobileMenu from './mobile-menu';
import NavbarRefresh from './refresh';
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
        <div
          class="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 md:flex"
        >
          <NavbarLogo />

          <NavbarDesktopMenu />

          <div class="flex items-center justify-self-center gap-2 md:ml-4">
            <NavbarRefresh />

            {{! <NavbarNotifications /> }}

            {{! <NavbarUserMenu /> }}
          </div>

          <div class="justify-self-end md:hidden">
            <NavbarMobileMenu />
          </div>
        </div>
      </div>
    </nav>
  </template>
}
