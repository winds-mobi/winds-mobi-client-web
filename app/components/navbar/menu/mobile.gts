import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { Button } from '@frontile/buttons';
import { Drawer } from '@frontile/overlays';
import List from 'ember-phosphor-icons/components/ph-list';
import { t } from 'ember-intl';
import { NAVBAR_MENU_ITEMS, type NavbarMenuItem } from './items';

export interface NavbarMenuMobileSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class NavbarMenuMobile extends Component<NavbarMenuMobileSignature> {
  @service declare router: RouterService;

  @tracked isOpen = false;

  @action
  open() {
    this.isOpen = true;
  }

  @action
  close() {
    this.isOpen = false;
  }

  @action
  navigate(route: NavbarMenuItem['route']) {
    this.close();
    void this.router.transitionTo(route);
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
        >
          <div class="p-4">
            <div class="w-full">
              <div class="flex flex-col items-stretch gap-2">
                {{#each NAVBAR_MENU_ITEMS as |item|}}
                  <Button
                    data-test-navbar-link={{item.route}}
                    @appearance="outlined"
                    @class="w-full"
                    @onPress={{fn this.navigate item.route}}
                  >
                    {{t item.labelKey}}
                  </Button>
                {{/each}}
              </div>
            </div>
          </div>
        </Drawer>
      {{/if}}
    </div>
  </template>
}
