import Component from '@glimmer/component';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import { Button } from 'frontile/buttons';
import { t } from 'ember-intl';
import ArrowClockwise from 'ember-phosphor-icons/components/ph-arrow-clockwise';
import type RefreshService from 'winds-mobi-client-web/services/refresh';

export interface NavbarRefreshControlSignature {
  Element: HTMLButtonElement;
}

export default class NavbarRefreshControl extends Component<NavbarRefreshControlSignature> {
  @service declare refresh: RefreshService;

  // One full turn per refresh, from any trigger (a press, the auto-refresh
  // tick, anything else that refreshes), derived from the service's
  // `refreshCount`. A CSS `transition` replays whenever the property value
  // changes, so each extra turn plays a forward one-off spin that runs to
  // completion however quick the refresh is; a refresh starting mid-spin just
  // retargets the transition further on.
  get spinStyle() {
    return htmlSafe(
      `transform: rotate(${this.refresh.refreshCount * 360}deg);`
    );
  }

  // How far through the interval since the last refresh this moment is: 0
  // right after one, 1 once an automatic refresh is due. Reuses the
  // service's own countdown state (`refreshLoop` already ticks `currentTime`
  // once a second while active) rather than running a timer of its own.
  // Guarded against non-finite input so a test double that doesn't model
  // the countdown (most don't need to) draws no progress instead of a
  // broken one.
  get progress(): number {
    const ratio = this.refresh.elapsedMs / this.refresh.refreshIntervalMs;

    return Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0;
  }

  get progressStyle() {
    return htmlSafe(`transform: scaleX(${this.progress});`);
  }

  <template>
    <Button
      aria-label={{t "map.refresh.ariaLabel"}}
      data-test-navbar-refresh
      @onPress={{this.refresh.refreshNow}}
      @variant="outline"
      @color="neutral"
      class="relative h-12"
      ...attributes
    >
      {{! The pill fills up with a soft primary tint as the next automatic
      refresh approaches, so pressing the button reads as "top this up now".
      The outer span clips the fill to the button's own rounded-full shape;
      the fill grows from the left by scaleX, a transform, so it animates
      without reflowing the button. The icon wrapper below is `relative` and
      comes later, so it stays on top of the fill. }}
      {{! template-lint-disable no-inline-styles }}
      <span
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
      >
        <span
          data-test-navbar-refresh-progress
          class="bg-primary-soft block h-full origin-left transition-transform duration-500 ease-linear"
          style={{this.progressStyle}}
        ></span>
      </span>

      {{! The one-off spin lives on this wrapper, apart from the icon's own
      `animate-spin` while a request is in flight: a `transition` and an
      `animation` on one element would fight over `transform`. The angle
      grows without bound, so it can't be a static Tailwind class. }}
      <span
        data-test-navbar-refresh-spin
        class="relative inline-flex transition-transform duration-500 ease-in-out"
        style={{this.spinStyle}}
      >
        {{! size-4! forces the icon past Frontile's own Button base class
        (its [&_svg]:size-[1em] rule), which scales every icon to the
        button's own font-size -- now much larger per v0.18's typography
        rescale, making unscaled icons look oversized. }}
        <ArrowClockwise
          class="size-4! {{if this.refresh.isRefreshing 'animate-spin'}}"
        />
      </span>
      {{! template-lint-enable no-inline-styles }}
    </Button>
  </template>
}
