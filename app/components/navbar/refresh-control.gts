import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { Button } from '@frontile/buttons';
import type { IntlService } from 'ember-intl';
import ArrowClockwise from 'ember-phosphor-icons/components/ph-arrow-clockwise';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

export interface NavbarRefreshControlSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

const PROGRESS_RADIUS = 17;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

export default class NavbarRefreshControl extends Component<NavbarRefreshControlSignature> {
  @service declare mapRefresh: MapRefreshService;
  @service declare intl: IntlService;

  get progressRatio() {
    return Math.min(
      1,
      this.mapRefresh.elapsedMs / this.mapRefresh.refreshIntervalMs
    );
  }

  get progressDasharray() {
    return `${PROGRESS_CIRCUMFERENCE * (1 - this.progressRatio)} ${PROGRESS_CIRCUMFERENCE}`;
  }

  get elapsedLabel() {
    const totalSeconds = Math.floor(this.mapRefresh.elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  get title() {
    const ariaLabel = String(this.intl.t('map.refresh.ariaLabel'));

    return `${ariaLabel} (${this.intl.t('map.refresh.sinceLast', {
      value: this.elapsedLabel,
    })})`;
  }

  @action
  handleRefresh() {
    this.mapRefresh.refreshNow();
  }

  <template>
    <Button
      aria-label={{this.title}}
      data-test-navbar-refresh
      @appearance="custom"
      @class="relative size-10 rounded-full bg-white p-0 text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30"
      title={{this.title}}
      @onPress={{this.handleRefresh}}
    >
      <span class="pointer-events-none relative flex size-full items-center justify-center">
        <svg
          aria-hidden="true"
          class="absolute inset-0 size-full -rotate-90"
          viewBox="0 0 40 40"
        >
          <circle
            class="text-slate-300/70"
            cx="20"
            cy="20"
            r={{PROGRESS_RADIUS}}
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          />
          <circle
            class="text-slate-500/80"
            cx="20"
            cy="20"
            r={{PROGRESS_RADIUS}}
            fill="none"
            stroke="currentColor"
            stroke-dasharray={{this.progressDasharray}}
            stroke-linecap="round"
            stroke-width="2.5"
          />
        </svg>
        <ArrowClockwise @size={{16}} class="relative text-slate-700" />
      </span>
    </Button>
  </template>
}
