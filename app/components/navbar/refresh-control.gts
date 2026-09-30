import Component from '@glimmer/component';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import { Button } from 'frontile/buttons';
import { t } from 'ember-intl';
import ArrowClockwise from 'ember-phosphor-icons/components/ph-arrow-clockwise';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

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

  <template>
    <Button
      aria-label={{t "map.refresh.ariaLabel"}}
      data-test-navbar-refresh
      @onPress={{this.mapRefresh.refreshNow}}
      @variant="outline"
      class="h-12"
      ...attributes
    >
      {{! The one-off spin lives on this wrapper, apart from the icon's own
      `animate-spin` while a request is in flight: a `transition` and an
      `animation` on one element would fight over `transform`. The angle
      grows without bound, so it can't be a static Tailwind class. }}
      {{! template-lint-disable no-inline-styles }}
      <span
        class="inline-flex transition-transform duration-500 ease-in-out"
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
