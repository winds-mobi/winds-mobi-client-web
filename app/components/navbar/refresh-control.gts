import Component from '@glimmer/component';
import { registerDestructor } from '@ember/destroyable';
import { action } from '@ember/object';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type { IntlService } from 'ember-intl';
import { t } from 'ember-intl';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

export interface NavbarRefreshControlSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

const RING_RADIUS = 13;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default class NavbarRefreshControl extends Component<NavbarRefreshControlSignature> {
  @service declare mapRefresh: MapRefreshService;
  @service declare intl: IntlService;

  constructor(owner: unknown, args: NavbarRefreshControlSignature['Args']) {
    super(owner, args);

    this.mapRefresh.activate();

    registerDestructor(this, () => {
      this.mapRefresh.deactivate();
    });
  }

  get progressRatio() {
    const remainingMs = Math.max(
      0,
      this.mapRefresh.nextRefreshAt - this.mapRefresh.now
    );

    return Math.min(1, remainingMs / this.mapRefresh.refreshIntervalMs);
  }

  get ringDasharray() {
    return `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
  }

  get ringDashoffset() {
    return RING_CIRCUMFERENCE * (1 - this.progressRatio);
  }

  get title() {
    return `${String(this.intl.t('map.refresh.ariaLabel'))} (${this.mapRefresh.countdownLabel})`;
  }

  @action
  handleRefresh() {
    this.mapRefresh.refreshNow();
  }

  <template>
    <button
      aria-label={{t "map.refresh.ariaLabel"}}
      class="relative grid h-10 w-10 place-items-center rounded-full p-0 leading-none text-slate-700 transition-colors hover:text-slate-900"
      data-test-navbar-refresh
      title={{this.title}}
      type="button"
      {{on "click" this.handleRefresh}}
    >
      <svg
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 32 32"
      >
        <circle
          cx="16"
          cy="16"
          r={{RING_RADIUS}}
          fill="none"
          stroke="currentColor"
          stroke-opacity="0.12"
          stroke-width="2"
        />
        <circle
          cx="16"
          cy="16"
          r={{RING_RADIUS}}
          fill="none"
          stroke="currentColor"
          stroke-dasharray={{this.ringDasharray}}
          stroke-dashoffset={{this.ringDashoffset}}
          stroke-linecap="round"
          stroke-width="2.5"
        />
      </svg>

      <svg
        aria-hidden="true"
        class="relative z-10 h-4.5 w-4.5"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.8"
        viewBox="0 0 24 24"
      >
        <path
          d="M16.023 9.348h4.992V4.356"
        />
        <path
          d="M2.985 19.644v-4.992h4.992"
        />
        <path
          d="m4.031 9.865 3.181-3.182a8.25 8.25 0 0 1 13.803 3.7"
        />
        <path
          d="m19.969 14.135-3.181 3.182a8.25 8.25 0 0 1-13.803-3.7"
        />
      </svg>

      <span data-test-navbar-refresh-countdown class="sr-only">
        {{this.mapRefresh.countdownLabel}}
      </span>
    </button>
  </template>
}
