import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { Button } from 'frontile/buttons';
import { Drawer } from 'frontile/overlays';
import List from 'ember-phosphor-icons/components/ph-list';
import { t } from 'ember-intl';
import onRouteChange from 'winds-mobi-client-web/modifiers/on-route-change';
import NavbarMenuLinks from './links';

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

  <template>
    {{! Closes the drawer reactively once a transition actually completes, rather
      than racing a click listener against LinkTo's own click handling on the same
      element — that race could let the browser's native anchor navigation win,
      causing a full page reload instead of an in-app transition. }}
    <div class="md:hidden" {{onRouteChange this.router this.close}}>
      <Button
        aria-label={{t "navigation.menu"}}
        data-test-navbar-mobile-menu-button
        @variant="outline"
        class="h-12"
        @onPress={{this.open}}
      >
        {{! size-4! forces the icon past Frontile's own Button base class
        (its [&_svg]:size-[1em] rule scales icons to the button's own
        font-size — much larger since v0.18's typography rescale). }}
        <List class="size-4!" />
      </Button>

      {{#if this.isOpen}}
        {{! @variant="flat" keeps every region on one surface -- Frontile
        v0.18's default, "sectioned", adds a black header band and a solid
        footer that this drawer isn't designed against (same reasoning as
        the station panel's own Drawer, see station/index.gts). }}
        <Drawer
          @allowCloseButton={{true}}
          @isOpen={{this.isOpen}}
          @onClose={{this.close}}
          @placement="right"
          @size="sm"
          @variant="flat"
          data-test-navbar-mobile-menu
          as |drawer|
        >
          <drawer.Header @title={{t "navigation.menu"}} />

          <drawer.Body>
            <NavbarMenuLinks @variant="mobile" />
          </drawer.Body>
        </Drawer>
      {{/if}}
    </div>
  </template>
}
