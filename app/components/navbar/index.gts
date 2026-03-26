/* eslint-disable @typescript-eslint/no-empty-object-type */
import Component from '@glimmer/component';
import NavbarLogo from './logo';
import NavbarMenuDesktop from './menu/desktop';
import NavbarMenuMobile from './menu/mobile';
import NavbarRefreshControl from './refresh-control';

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

          <NavbarMenuDesktop />

          <div class="flex items-center justify-self-center gap-2 md:ml-4">
            <NavbarRefreshControl />
          </div>

          <div class="justify-self-end md:hidden">
            <NavbarMenuMobile />
          </div>
        </div>
      </div>
    </nav>
  </template>
}
