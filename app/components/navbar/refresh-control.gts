import Component from '@glimmer/component';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import { Button } from '@frontile/buttons';
import { t } from 'ember-intl';
import ArrowClockwise from 'ember-phosphor-icons/components/ph-arrow-clockwise';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type SettingsService from 'winds-mobi-client-web/services/settings';

export interface NavbarRefreshControlSignature {
  Element: HTMLButtonElement;
}

export default class NavbarRefreshControl extends Component<NavbarRefreshControlSignature> {
  @service declare mapRefresh: MapRefreshService;
  @service declare settings: SettingsService;

  // Derived straight from the service's `refreshCount` (bumped once per
  // refresh, from any trigger — a press, the auto-refresh tick, or a
  // force-refresh from elsewhere) rather than an imperative counter of our
  // own, so this never needs a side-effecting watcher (no modifier, no
  // backtracking-render risk). A CSS `transition` (unlike a keyframe
  // `animation`, which only replays when its `animation-name` value
  // changes) replays whenever the actual property value changes, so each
  // additional full turn plays a forward one-off spin -- it runs to
  // completion regardless of how long the refresh itself takes, and if
  // another refresh starts mid-spin, the transition just restarts toward
  // the new (further) target from wherever it currently is. Beta feature
  // (see app/services/settings.ts): only spins once beta features are
  // enabled, in addition to its own toggle.
  get spinDegrees() {
    const spinEnabled =
      this.settings.betaFeaturesEnabled && this.settings.refreshButtonSpin;

    return spinEnabled ? this.mapRefresh.refreshCount * 360 : 0;
  }

  get spinStyle() {
    return htmlSafe(`transform: rotate(${this.spinDegrees}deg);`);
  }

  <template>
    <Button
      aria-label={{t "map.refresh.ariaLabel"}}
      data-test-navbar-refresh
      @onPress={{this.mapRefresh.refreshNow}}
      @appearance="outlined"
      class="h-12"
      ...attributes
    >
      {{! The wrapping span plays a guaranteed one-off spin every time a
      refresh starts -- from a press, the auto-refresh tick, or anything
      else that calls `refreshNow` -- independent of the icon's own
      continuous `animate-spin` while a request is actually in flight. Kept
      on a separate element since a `transition` and an `animation` both
      driving `transform` would otherwise fight over the same property on
      one element. The rotation angle is an ever-increasing runtime value
      with no fixed set of degrees, so it can't be a static Tailwind class
      -- everything else about the transition (property/duration/easing)
      is. }}
      {{! template-lint-disable no-inline-styles }}
      <span
        class="inline-flex transition-transform duration-500 ease-in-out"
        style={{this.spinStyle}}
      >
        <ArrowClockwise
          class={{if this.mapRefresh.isRefreshing "animate-spin"}}
        />
      </span>
      {{! template-lint-enable no-inline-styles }}
    </Button>
  </template>
}
