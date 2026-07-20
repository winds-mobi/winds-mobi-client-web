import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { htmlSafe } from '@ember/template';
import { t } from 'ember-intl';
import ArrowClockwise from 'ember-phosphor-icons/components/ph-arrow-clockwise';

export interface SettingsShowcaseRefreshSpinSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// A standalone demo button previewing the refresh button's one-off spin (see
// app/components/navbar/refresh-control.gts) without touching
// `mapRefresh.refreshNow` — this only plays the animation, it never refreshes
// anything. Disabled, pressing it does nothing, matching the real control.
export default class SettingsShowcaseRefreshSpin extends Component<SettingsShowcaseRefreshSpinSignature> {
  @tracked private spinDegrees = 0;

  get spinStyle() {
    return htmlSafe(`transform: rotate(${this.spinDegrees}deg);`);
  }

  handlePress = () => {
    if (!this.args.enabled) {
      return;
    }

    this.spinDegrees += 360;
  };

  <template>
    <div
      class="flex items-center justify-center rounded-lg bg-slate-100 p-4"
      ...attributes
    >
      <button
        type="button"
        aria-label={{t "settings.refreshButtonSpin.tryIt"}}
        class="rounded-full border border-slate-300 bg-white p-2"
        {{on "click" this.handlePress}}
      >
        {{! template-lint-disable no-inline-styles }}
        <span
          class="inline-flex transition-transform duration-500 ease-in-out"
          style={{this.spinStyle}}
        >
          <ArrowClockwise />
        </span>
        {{! template-lint-enable no-inline-styles }}
      </button>
    </div>
  </template>
}
