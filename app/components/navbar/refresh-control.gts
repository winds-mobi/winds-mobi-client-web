import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import { Button } from '@frontile/buttons';
import type { IntlService } from 'ember-intl';
import ArrowsClockwise from 'ember-phosphor-icons/components/ph-arrows-clockwise';
import { renderTimeAgoText } from 'winds-mobi-client-web/helpers/time-ago';
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
    return Math.min(
      1,
      this.mapRefresh.remainingMs / this.mapRefresh.refreshIntervalMs
    );
  }

  get countdownRingStyle() {
    return htmlSafe(
      `background: conic-gradient(from -90deg, ${COUNTDOWN_ARC_COLOR} 0turn, ${COUNTDOWN_ARC_COLOR} ${this.progressRatio}turn, transparent ${this.progressRatio}turn, transparent 1turn)`
    );
  }

  get refreshRelativeTime() {
    return Math.round(this.mapRefresh.secondsRemaining);
  }

  get title() {
    const ariaLabel = String(this.intl.t('map.refresh.ariaLabel'));

    return `${ariaLabel} (${renderTimeAgoText(this.intl, this.refreshRelativeTime)})`;
  }

  @action
  handleRefresh() {
    this.mapRefresh.refreshNow();
  }

  <template>
    <Button
      class="relative"
      aria-label={{this.title}}
      data-test-navbar-refresh
      @appearance="outlined"
      title={{this.title}}
      @onPress={{this.handleRefresh}}
      {{activateMapRefresh this.mapRefresh}}
      style={{this.countdownRingStyle}}
    >
      <ArrowsClockwise @color="#000" @size={{18}} />
    </Button>
  </template>
}
