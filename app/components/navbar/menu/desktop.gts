import Component from '@glimmer/component';
import { service } from '@ember/service';
import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import { visibleNavbarMenuItems } from './items';

export interface NavbarMenuDesktopSignature {
  Args: Record<string, never>;
  Element: null;
}

export default class NavbarMenuDesktop extends Component<NavbarMenuDesktopSignature> {
  @service declare settings: SettingsService;

  get visibleItems() {
    return visibleNavbarMenuItems(this.settings.betaFeaturesEnabled);
  }

  <template>
    <div class="hidden items-center gap-1 md:flex">
      {{#each this.visibleItems as |item|}}
        <LinkTo
          @route={{item.route}}
          @activeClass="border-wind-20 bg-wind-20 font-semibold text-white shadow-sm hover:border-wind-20 hover:text-white"
          class="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          data-test-navbar-link={{item.route}}
        >
          <item.icon @size={{16}} />
          {{t item.labelKey}}
        </LinkTo>
      {{/each}}
    </div>
  </template>
}
