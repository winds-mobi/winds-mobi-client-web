import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import { Button } from '@frontile/buttons';
import type { IntlService } from 'ember-intl';
import { t } from 'ember-intl';
import ArrowsClockwise from 'ember-phosphor-icons/components/ph-arrows-clockwise';
import activateMapRefresh from 'winds-mobi-client-web/modifiers/activate-map-refresh';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

export interface NavbarRefreshControlSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

const COUNTDOWN_ARC_COLOR = 'rgb(148 163 184 / 0.5)';

export default class NavbarRefreshControl extends Component<NavbarRefreshControlSignature> {
  @service declare mapRefresh: MapRefreshService;
  @service declare intl: IntlService;

  get progressRatio() {
    const remainingMs = Math.max(
      0,
      this.mapRefresh.nextRefreshAt - this.mapRefresh.now
    );

    return Math.min(1, remainingMs / this.mapRefresh.refreshIntervalMs);
  }

  get countdownRingStyle() {
    return htmlSafe(
      `background: conic-gradient(from -90deg, ${COUNTDOWN_ARC_COLOR} 0turn, ${COUNTDOWN_ARC_COLOR} ${this.progressRatio}turn, transparent ${this.progressRatio}turn, transparent 1turn)`
    );
  }

  get title() {
    return `${String(this.intl.t('map.refresh.ariaLabel'))} (${
      this.mapRefresh.countdownLabel
    })`;
  }

  @action
  handleRefresh() {
    this.mapRefresh.refreshNow();
  }

  <template>
    <Button
      class="relative"
      aria-label={{t "map.refresh.ariaLabel"}}
      data-test-navbar-refresh
      @appearance="outlined"
      title={{this.title}}
      @onPress={{this.handleRefresh}}
      {{activateMapRefresh this.mapRefresh}}
      style={{this.countdownRingStyle}}
    >
      <ArrowsClockwise @color="#000" @size={{18}} />

      <span data-test-navbar-refresh-countdown class="sr-only">
        {{this.mapRefresh.countdownLabel}}
      </span>
    </Button>
  </template>
}
