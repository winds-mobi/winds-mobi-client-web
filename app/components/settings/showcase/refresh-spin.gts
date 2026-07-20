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
// Square with a subtle corner radius to match the real navbar button's
// actual rendered shape (~48x48, `rounded-sm`), not a generic circular demo
// button.
export default class SettingsShowcaseRefreshSpin extends Component<SettingsShowcaseRefreshSpinSignature> {
  // Presses only ever change via a real click event (safe to write tracked
  // state from), never from a modifier reacting to `@enabled` -- an earlier
  // attempt did that and hit an Ember backtracking-render assertion (writing
  // a tracked value that this same component's own render already read in
  // the same computation; see app/components/navbar/refresh-control.gts's
  // history for the same failure on the real button). `spinDegrees` below is
  // instead purely derived from `@enabled` and this counter, so turning the
  // preference on plays a spin with no imperative write at all.
  @tracked private pressCount = 0;

  get spinDegrees() {
    const enabledTurn = this.args.enabled ? 360 : 0;

    return this.pressCount * 360 + enabledTurn;
  }

  get spinStyle() {
    return htmlSafe(`transform: rotate(${this.spinDegrees}deg);`);
  }

  handlePress = () => {
    if (!this.args.enabled) {
      return;
    }

    this.pressCount++;
  };

  <template>
    <div
      class="flex items-center justify-center rounded-lg bg-slate-100 p-4"
      ...attributes
    >
      <button
        type="button"
        aria-label={{t "settings.refreshButtonSpin.tryIt"}}
        class="flex h-12 w-12 items-center justify-center rounded-sm border border-slate-300 bg-white"
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
