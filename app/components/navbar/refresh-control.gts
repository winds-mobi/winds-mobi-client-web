import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import { Button } from '@frontile/buttons';
import type { IntlService } from 'ember-intl';
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
      this.mapRefresh.elapsedMs / this.mapRefresh.refreshIntervalMs
    );
  }

  get progressCircleStyle() {
    return htmlSafe(
      `background: conic-gradient(from 0deg, transparent 0turn, transparent ${this.progressRatio}turn, ${COUNTDOWN_ARC_COLOR} ${this.progressRatio}turn, ${COUNTDOWN_ARC_COLOR} 1turn)`
    );
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
      @appearance="outlined"
      @class="px-2.5 font-mono tabular-nums"
      title={{this.title}}
      @onPress={{this.handleRefresh}}
      {{activateMapRefresh this.mapRefresh}}
    >
      <span class="flex items-center gap-2">
        <span
          class="inline-block size-4 shrink-0 rounded-full border border-slate-500/70"
          style={{this.progressCircleStyle}}
        ></span>
        <span>{{this.elapsedLabel}}</span>
      </span>
    </Button>
  </template>
}
