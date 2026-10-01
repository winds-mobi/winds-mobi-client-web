import type { TOC } from '@ember/component/template-only';
import NavbarMenuLinks from './links';
import NavbarMenuViewSwitch from './view-switch';

export interface NavbarMenuDesktopSignature {
  Args: Record<string, never>;
  Element: null;
}

// Three groups, in the order the questions are asked: which stations, how they
// are drawn, and then everything that isn't a station list. The view switch
// sits with the surfaces it applies to, and renders nothing on Settings or
// Help; the wider gap before the last group keeps those two from reading as
// more places to look at stations.
const NavbarMenuDesktop: TOC<NavbarMenuDesktopSignature> = <template>
  <div class="hidden items-center gap-3 md:flex">
    <NavbarMenuLinks @variant="desktop" @group="surfaces" />
    <NavbarMenuViewSwitch @variant="desktop" />

    <span aria-hidden="true" class="h-6 w-px shrink-0 bg-slate-200"></span>

    <NavbarMenuLinks @variant="desktop" @group="utilities" />
  </div>
</template>;

export default NavbarMenuDesktop;
