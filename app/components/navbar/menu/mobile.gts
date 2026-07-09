import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { LinkTo } from '@ember/routing';
import type RouterService from '@ember/routing/router-service';
import { Button } from '@frontile/buttons';
import { Drawer } from '@frontile/overlays';
import List from 'ember-phosphor-icons/components/ph-list';
import { t } from 'ember-intl';
import onRouteChange from 'winds-mobi-client-web/modifiers/on-route-change';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import { visibleNavbarMenuItems } from './items';

export interface NavbarMenuMobileSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class NavbarMenuMobile extends Component<NavbarMenuMobileSignature> {
  @service declare router: RouterService;
  @service declare settings: SettingsService;

  @tracked isOpen = false;

  get visibleItems() {
    return visibleNavbarMenuItems(this.settings.betaFeaturesEnabled);
  }

  @action
  open() {
    this.isOpen = true;
  }

  @action
  close() {
    this.isOpen = false;
  }

  <template>
    {{! Closes the drawer reactively once a transition actually completes, rather
      than racing a click listener against LinkTo's own click handling on the same
      element — that race could let the browser's native anchor navigation win,
      causing a full page reload instead of an in-app transition. }}
    <div class="md:hidden" {{onRouteChange this.router this.close}}>
      <Button
        aria-label={{t "navigation.menu"}}
        data-test-navbar-mobile-menu-button
        @appearance="outlined"
        class="h-12"
        @onPress={{this.open}}
      >
        <List />
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
              {{#each this.visibleItems as |item|}}
                <LinkTo
                  @route={{item.route}}
                  @activeClass="border-wind-20 bg-wind-20 font-semibold text-white shadow-sm hover:bg-wind-20 hover:text-white"
                  data-test-navbar-link={{item.route}}
                  class="inline-flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <item.icon @size={{16}} />
                  <span>{{t item.labelKey}}</span>
                </LinkTo>
              {{/each}}
            </div>
          </drawer.Body>
        </Drawer>
      {{/if}}
    </div>
  </template>
}
