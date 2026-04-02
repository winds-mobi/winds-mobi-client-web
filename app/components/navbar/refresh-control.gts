import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { Button } from '@frontile/buttons';
import type { PressEvent } from '@frontile/utilities/modifiers/press';
import { t } from 'ember-intl';
import type { IntlService } from 'ember-intl';
import ArrowClockwise from 'ember-phosphor-icons/components/ph-arrow-clockwise';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

export interface NavbarRefreshControlSignature {
  Args: {
    appearance: 'desktop' | 'mobile';
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class NavbarRefreshControl extends Component<NavbarRefreshControlSignature> {
  @service declare mapRefresh: MapRefreshService;
  @service declare intl: IntlService;

  get isMobileAppearance() {
    return this.args.appearance === 'mobile';
  }

  get buttonClass() {
    if (this.isMobileAppearance) {
      return 'w-full justify-start';
    }

    return 'size-9 rounded-full p-0 text-slate-500 transition hover:bg-white/70 hover:text-wind-20';
  }

  get ariaLabel() {
    return String(this.intl.t('map.refresh.ariaLabel'));
  }

  @action
  handleRefresh(event: PressEvent) {
    const icon = event.target.querySelector('[data-refresh-icon]');

    if (icon instanceof Element) {
      icon.animate(
        [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(360deg)' },
        ],
        {
          duration: 550,
          easing: 'linear',
          iterations: 1,
        }
      );
    }

    this.mapRefresh.refreshNow();
  }

  <template>
    <Button
      aria-label={{this.ariaLabel}}
      data-test-navbar-refresh
      @appearance={{if this.isMobileAppearance "outlined" "custom"}}
      @class={{this.buttonClass}}
      @onPress={{this.handleRefresh}}
    >
      {{#if this.isMobileAppearance}}
        <span class="inline-flex items-center gap-2">
          <span data-refresh-icon>
            <ArrowClockwise @size={{14}} />
          </span>
          <span>{{t "map.refresh.label"}}</span>
        </span>
      {{else}}
        <span class="grid size-full place-items-center">
          <span data-refresh-icon class="inline-flex">
            <ArrowClockwise @size={{14}} />
          </span>
        </span>
      {{/if}}
    </Button>
  </template>
}
