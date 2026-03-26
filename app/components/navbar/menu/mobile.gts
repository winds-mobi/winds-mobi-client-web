import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { action } from '@ember/object';
import { LinkTo } from '@ember/routing';
import { Button } from '@frontile/buttons';
import { Drawer } from '@frontile/overlays';
import List from 'ember-phosphor-icons/components/ph-list';
import { t } from 'ember-intl';
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
            <div class="w-full">
              <div class="flex flex-col items-stretch gap-2">
                {{#each NAVBAR_MENU_ITEMS as |item|}}
                  <LinkTo
                    @route={{item.route}}
                    @activeClass="bg-slate-900 text-white"
                    class="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    data-test-navbar-link={{item.route}}
                    {{on "click" this.close}}
                  >
                    {{t item.labelKey}}
                  </LinkTo>
                {{/each}}
              </div>
            </div>
          </drawer.Body>
        </Drawer>
      {{/if}}
    </div>
  </template>
}
