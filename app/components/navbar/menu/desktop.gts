import type { TOC } from '@ember/component/template-only';
import NavbarMenuLinks from './links';

export interface NavbarMenuDesktopSignature {
  Args: Record<string, never>;
  Element: null;
}

const NavbarMenuDesktop: TOC<NavbarMenuDesktopSignature> = <template>
  <div class="hidden md:flex">
    <NavbarMenuLinks @variant="desktop" />
  </div>
</template>;

export default NavbarMenuDesktop;
