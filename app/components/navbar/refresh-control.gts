import Component from '@glimmer/component';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import { Button } from 'frontile/buttons';
import { t } from 'ember-intl';
import ArrowClockwise from 'ember-phosphor-icons/components/ph-arrow-clockwise';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

// Sized to sit just inside a 44px viewBox (see the template) with room for
// its own 2px stroke.
const RING_RADIUS = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export interface NavbarRefreshControlSignature {
  Element: HTMLButtonElement;
}

export default class NavbarRefreshControl extends Component<NavbarRefreshControlSignature> {
  @service declare mapRefresh: MapRefreshService;

  // One full turn per refresh, from any trigger (a press, the auto-refresh
  // tick, anything else that refreshes), derived from the service's
  // `refreshCount`. A CSS `transition` replays whenever the property value
  // changes, so each extra turn plays a forward one-off spin that runs to
  // completion however quick the refresh is; a refresh starting mid-spin just
  // retargets the transition further on.
  get spinStyle() {
    return htmlSafe(
      `transform: rotate(${this.mapRefresh.refreshCount * 360}deg);`
    );
  }

  // How far through the interval since the last refresh this moment is: 0
  // right after one, 1 once an automatic refresh is due. Reuses the
  // service's own countdown state (`refreshLoop` already ticks `currentTime`
  // once a second while active) rather than running a timer of its own.
  // Guarded against non-finite input so a test double that doesn't model
  // the countdown (most don't need to) draws an empty ring instead of a
  // broken one.
  get progress(): number {
    const ratio = this.mapRefresh.elapsedMs / this.mapRefresh.refreshIntervalMs;

    return Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0;
  }

  get ringDashOffset() {
    return htmlSafe(
      `stroke-dashoffset: ${RING_CIRCUMFERENCE * (1 - this.progress)}px;`
    );
  }

  <template>
    <Button
      aria-label={{t "map.refresh.ariaLabel"}}
      data-test-navbar-refresh
      @onPress={{this.mapRefresh.refreshNow}}
      @variant="outline"
      class="relative h-12 w-12"
      ...attributes
    >
      {{! A ring showing how close the next automatic refresh is, so pressing
      the button reads as "top this up now" rather than an unexplained icon
      sitting in the bar. It's information, not decoration.
      Two stacked circles, since this app has no conic-gradient to reach for:
      a faint full track, then a second circle whose dash array equals its
      own circumference, offset to reveal only the progress fraction of it --
      rotated -90deg so that fraction grows clockwise from 12 o'clock instead
      of the dash offset's own zero point at 3 o'clock. The progress stroke
      uses Frontile's `primary`, the same colour as the navbar's active-link
      indicator. }}
      {{! template-lint-disable no-inline-styles }}
      {{! size-full! forces this past the same Frontile Button base rule the
      icon below works around ([&_svg]:size-[1em]), which would otherwise
      shrink the ring to a 1em square in the button's top-left corner. }}
      <svg
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 size-full! -rotate-90"
        viewBox="0 0 44 44"
      >
        <circle
          class="text-slate-200"
          cx="22"
          cy="22"
          r={{RING_RADIUS}}
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        />
        <circle
          data-test-navbar-refresh-progress
          class="text-primary transition-[stroke-dashoffset] duration-500 ease-linear"
          cx="22"
          cy="22"
          r={{RING_RADIUS}}
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-dasharray={{RING_CIRCUMFERENCE}}
          style={{this.ringDashOffset}}
        />
      </svg>

      {{! The one-off spin lives on this wrapper, apart from the icon's own
      `animate-spin` while a request is in flight: a `transition` and an
      `animation` on one element would fight over `transform`. The angle
      grows without bound, so it can't be a static Tailwind class. }}
      <span
        class="relative inline-flex transition-transform duration-500 ease-in-out"
        style={{this.spinStyle}}
      >
        {{! size-4! forces the icon past Frontile's own Button base class
        (its [&_svg]:size-[1em] rule), which scales every icon to the
        button's own font-size -- now much larger per v0.18's typography
        rescale, making unscaled icons look oversized. }}
        <ArrowClockwise
          class="size-4! {{if this.mapRefresh.isRefreshing 'animate-spin'}}"
        />
      </span>
      {{! template-lint-enable no-inline-styles }}
    </Button>
  </template>
}
