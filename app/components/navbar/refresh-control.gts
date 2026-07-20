import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { Button } from '@frontile/buttons';
import { t } from 'ember-intl';
import ArrowClockwise from 'ember-phosphor-icons/components/ph-arrow-clockwise';
import { oneOffSpinClass } from 'winds-mobi-client-web/utils/one-off-spin';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type SettingsService from 'winds-mobi-client-web/services/settings';

export interface NavbarRefreshControlSignature {
  Element: HTMLButtonElement;
}

export default class NavbarRefreshControl extends Component<NavbarRefreshControlSignature> {
  @service declare mapRefresh: MapRefreshService;
  @service declare settings: SettingsService;

  // Counts presses so `pressSpinClass` alternates between two one-off spin
  // utilities via `oneOffSpinClass` — see that function for why alternating
  // is needed to make the CSS animation replay on every press.
  @tracked private pressCount = 0;

  // Beta feature (see app/services/settings.ts): the animation only plays
  // once beta features are enabled, in addition to its own toggle.
  get pressSpinClass() {
    return this.settings.betaFeaturesEnabled && this.settings.refreshButtonSpin
      ? oneOffSpinClass(this.pressCount)
      : '';
  }

  handlePress = () => {
    this.pressCount++;
    this.mapRefresh.refreshNow();
  };

  <template>
    <Button
      aria-label={{t "map.refresh.ariaLabel"}}
      data-test-navbar-refresh
      @onPress={{this.handlePress}}
      @appearance="outlined"
      class="h-12"
      ...attributes
    >
      {{! The wrapping span plays a guaranteed one-off 360° spin on every
      press (`pressSpinClass`) so a fast refresh still gives visible click
      feedback, independent of the icon's own continuous `animate-spin`
      while a request is actually in flight (a manual refresh, the
      auto-refresh tick, or a pan/zoom load). Kept on separate elements
      since two Tailwind `animate-*` utilities on the same element would
      overwrite each other's `animation` property rather than combine. }}
      <span class={{this.pressSpinClass}}>
        <ArrowClockwise
          class={{if this.mapRefresh.isRefreshing "animate-spin"}}
        />
      </span>
    </Button>
  </template>
}
