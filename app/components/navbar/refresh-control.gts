import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import { Button } from '@frontile/buttons';
import type { IntlService } from 'ember-intl';
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
const RELATIVE_TIME_THRESHOLDS: Array<{
  limit: number;
  unit: Intl.RelativeTimeFormatUnit;
  divisor: number;
}> = [
  { limit: 60, unit: 'second', divisor: 1 },
  { limit: 3600, unit: 'minute', divisor: 60 },
  { limit: 86400, unit: 'hour', divisor: 3600 },
  { limit: 604800, unit: 'day', divisor: 86400 },
  { limit: 2629800, unit: 'week', divisor: 604800 },
  { limit: 31557600, unit: 'month', divisor: 2629800 },
  { limit: Infinity, unit: 'year', divisor: 31557600 },
];

function countdownRelativeTime(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return null;
  }

  const absSeconds = Math.abs(seconds);

  for (const { limit, unit, divisor } of RELATIVE_TIME_THRESHOLDS) {
    if (absSeconds < limit) {
      return {
        value: Math.round(seconds / divisor),
        unit,
      };
    }
  }

  return null;
}

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
    return countdownRelativeTime(this.mapRefresh.secondsRemaining);
  }

  get title() {
    const ariaLabel = String(this.intl.t('map.refresh.ariaLabel'));
    const refreshRelativeTime = this.refreshRelativeTime;

    if (!refreshRelativeTime) {
      return ariaLabel;
    }

    return `${ariaLabel} (${this.intl.formatRelativeTime(
      refreshRelativeTime.value,
      {
        unit: refreshRelativeTime.unit,
      }
    )})`;
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
