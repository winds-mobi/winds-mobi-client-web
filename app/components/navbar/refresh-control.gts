import Component from '@glimmer/component';
import { service } from '@ember/service';
import { Button } from '@frontile/buttons';
import { t } from 'ember-intl';
import ArrowClockwise from 'ember-phosphor-icons/components/ph-arrow-clockwise';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

export interface NavbarRefreshControlSignature {
  Element: HTMLButtonElement;
}

export default class NavbarRefreshControl extends Component<NavbarRefreshControlSignature> {
  @service declare mapRefresh: MapRefreshService;

  <template>
    <Button
      aria-label={{t "map.refresh.ariaLabel"}}
      data-test-navbar-refresh
      @onPress={{this.mapRefresh.refreshNow}}
      @appearance="outlined"
      class="h-12"
      ...attributes
    >
      {{! Spins for as long as any registered request is in flight (a manual
      refresh, the auto-refresh tick, or a pan/zoom load) — no fixed-duration
      animation. }}
      <ArrowClockwise
        class={{if this.mapRefresh.isRefreshing "animate-spin"}}
      />
    </Button>
  </template>
}
