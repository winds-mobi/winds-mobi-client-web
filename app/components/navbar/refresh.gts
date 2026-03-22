import Component from '@glimmer/component';
import { Button } from '@frontile/buttons';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { t } from 'ember-intl';
import ArrowsClockwise from 'ember-phosphor-icons/components/ph-arrows-clockwise';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

export interface NavbarRefreshSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class NavbarRefresh extends Component<NavbarRefreshSignature> {
  @service declare mapRefresh: MapRefreshService;

  get isVisible() {
    return this.mapRefresh.isActive;
  }

  @action
  handleRefresh() {
    this.mapRefresh.refreshNow();
  }

  <template>
    {{#if this.isVisible}}
      <Button
        aria-label={{t "map.refresh.ariaLabel"}}
        class="flex items-center gap-2 whitespace-nowrap px-2.5 text-slate-700"
        data-test-navbar-refresh
        title={{t "map.refresh.ariaLabel"}}
        @appearance="minimal"
        @onPress={{this.handleRefresh}}
      >
        <ArrowsClockwise class="h-4 w-4 shrink-0" />

        <span class="hidden sm:inline">
          {{t "map.refresh.label"}}
        </span>

        <span
          data-test-navbar-refresh-countdown
          class="font-mono text-[11px] font-semibold text-slate-500"
        >
          {{this.mapRefresh.countdownLabel}}
        </span>
      </Button>
    {{/if}}
  </template>
}
