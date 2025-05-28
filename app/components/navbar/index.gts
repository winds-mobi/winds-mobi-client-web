import Component from '@glimmer/component';
import NavbarLogo from './logo';
// import NavbarSearch from './search';
import NavbarButtons from './buttons';
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
    <nav class="bg-white shadow">
      <div class="px-2 sm:px-4 lg:px-8">
        <div class="flex h-16 justify-between">
          <NavbarLogo />

          {{! <NavbarSearch /> }}

          <NavbarButtons />

          {{! TODO: <NavbarMobileMenu::Button /> }}
          <div class="hidden lg:ml-4 lg:flex lg:items-center">
            {{! <NavbarNotifications /> }}

            {{! <NavbarUserMenu /> }}
          </div>
        </div>
      </div>

      {{! <NavbarMobileMenu /> }}
    </nav>
  </template>
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    Navbar: typeof Navbar;
  }
}
