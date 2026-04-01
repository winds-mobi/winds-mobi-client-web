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
import NavbarRefreshControl from '../refresh-control';
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
            <div class="w-full space-y-4">
              <div class="flex flex-col items-stretch gap-2">
                {{#each NAVBAR_MENU_ITEMS as |item|}}
                  <Button
                    data-test-navbar-link={{item.route}}
                    @appearance="outlined"
                    @class="w-full"
                    @onPress={{fn this.navigate item.route}}
                  >
                    <span class="inline-flex items-center gap-2">
                      <item.icon @size={{16}} />
                      <span>{{t item.labelKey}}</span>
                    </span>
                  </Button>
                {{/each}}
              </div>

              <div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-sm font-medium text-slate-950">
                    {{t "map.refresh.label"}}
                  </p>

                  <NavbarRefreshControl />
                </div>
              </div>
            </div>
          </drawer.Body>
        </Drawer>
      {{/if}}
    </div>
  </template>
}
