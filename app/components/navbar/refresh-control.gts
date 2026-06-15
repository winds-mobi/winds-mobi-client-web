import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { Button } from '@frontile/buttons';
import type { PressEvent } from '@frontile/utilities/modifiers/press';
import { t } from 'ember-intl';
import ArrowClockwise from 'ember-phosphor-icons/components/ph-arrow-clockwise';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

export interface NavbarRefreshControlSignature {
  Element: HTMLButtonElement;
}

export default class NavbarRefreshControl extends Component<NavbarRefreshControlSignature> {
  @service declare mapRefresh: MapRefreshService;

  @action
  handleRefresh(event: PressEvent) {
    const icon = event.target.querySelector('[data-refresh-icon]');

    if (icon instanceof Element) {
      icon.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
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
      aria-label={{t "map.refresh.ariaLabel"}}
      data-test-navbar-refresh
      @appearance="outlined"
      @size="sm"
      @onPress={{this.handleRefresh}}
      ...attributes
    >
      <span class="inline-flex items-center gap-1.5">
        <span data-refresh-icon class="inline-flex">
          <ArrowClockwise @size={{16}} />
        </span>
        <span>{{t "map.refresh.label"}}</span>
      </span>
    </Button>
  </template>
}
