import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { Button } from '@frontile/buttons';
import { Drawer } from '@frontile/overlays';
import List from 'ember-phosphor-icons/components/ph-list';
import { t } from 'ember-intl';
import NavbarRouteSwitch from './route-switch';

export interface NavbarMobileMenuSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class NavbarMobileMenu extends Component<NavbarMobileMenuSignature> {
  @tracked isOpen = false;

  @action
  open() {
    this.isOpen = true;
  }

  @action
  close() {
    this.isOpen = false;
  }

  <template>
    <div class="md:hidden">
      <Button
        aria-label={{t "navigation.menu"}}
        data-test-navbar-mobile-menu-button
        @appearance="outlined"
        @class="px-2.5"
        @onPress={{this.open}}
      >
        <List @size={{18}} />
      </Button>

      {{#if this.isOpen}}
        <Drawer
          @allowCloseButton={{true}}
          @isOpen={{this.isOpen}}
          @onClose={{this.close}}
          @placement="right"
          @size="sm"
          data-test-navbar-mobile-menu
          as |drawer|
        >
          <drawer.Header>
            <div class="pr-10">
              <h2 class="text-base font-semibold text-slate-950">
                {{t "navigation.menu"}}
              </h2>
            </div>
          </drawer.Header>

          <drawer.Body>
            <NavbarRouteSwitch @layout="drawer" @onNavigate={{this.close}} />
          </drawer.Body>
        </Drawer>
      {{/if}}
    </div>
  </template>
}
