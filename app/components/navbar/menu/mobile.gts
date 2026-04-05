import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { LinkTo } from '@ember/routing';
import { Button } from '@frontile/buttons';
import { Drawer } from '@frontile/overlays';
import List from 'ember-phosphor-icons/components/ph-list';
import { t } from 'ember-intl';
import NavbarRefreshControl from '../refresh-control';
import { NAVBAR_MENU_ITEMS } from './items';

export interface NavbarMenuMobileSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class NavbarMenuMobile extends Component<NavbarMenuMobileSignature> {
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
            <div class="flex w-full flex-col items-stretch gap-2">
              {{#each NAVBAR_MENU_ITEMS as |item|}}
                <LinkTo
                  @route={{item.route}}
                  @activeClass="border-wind-20 bg-wind-5 text-wind-20"
                  data-test-navbar-link={{item.route}}
                  class="inline-flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <item.icon @size={{16}} />
                  <span>{{t item.labelKey}}</span>
                </LinkTo>
              {{/each}}

              <NavbarRefreshControl @appearance="mobile" />
            </div>
          </drawer.Body>
        </Drawer>
      {{/if}}
    </div>
  </template>
}
