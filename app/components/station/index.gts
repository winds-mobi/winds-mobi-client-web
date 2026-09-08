import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { hash } from '@ember/helper';
import type RouterService from '@ember/routing/router-service';
import { Button } from '@frontile/buttons';
import { Drawer } from '@frontile/overlays';
import X from 'ember-phosphor-icons/components/ph-x';
import StationHeader from './header';
import StationMeta from './meta';
import StationSummary from './summary';
import StationAir from './air';
import StationWind from './wind';
import { t } from 'ember-intl';
import { currentMapView } from 'winds-mobi-client-web/utils/map-view';
import { SIDE_PANEL_QUERY } from 'winds-mobi-client-web/utils/map-padding';
import trackMediaQuery from 'winds-mobi-client-web/modifiers/track-media-query';
import type { Station } from 'winds-mobi-client-web/services/store.js';

export interface StationIndexSignature {
  Args: {
    station?: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationIndex extends Component<StationIndexSignature> {
  @service declare router: RouterService;

  @tracked isSidePanel = false;

  setIsSidePanel = (matches: boolean) => {
    this.isSidePanel = matches;
  };

  get placement(): 'left' | 'bottom' {
    return this.isSidePanel ? 'left' : 'bottom';
  }

  get mapView() {
    return currentMapView(this.router);
  }

  @action
  close() {
    this.router.transitionTo('map', {
      queryParams: this.mapView,
    });
  }

  <template>
    {{! Fills the map's overlay slot, which owns the panel's size and where it
    sits (app/components/map/index.gts) — the map measures that slot to know
    how much of itself the panel covers. @renderInPlace keeps the Drawer
    scoped to that slot (instead of Frontile's default full-viewport portal),
    so its w-full/h-full base classes resolve against the slot's own
    responsive size, and its placement classes just pin it to the slot's
    edges — no width/height math of our own needed. @placement mirrors the
    slot's own bottom-sheet/side-panel breakpoint (SIDE_PANEL_QUERY above)
    so the slide direction always matches the box actually on screen.

    No backdrop, no focus trap, and outside clicks never close it: the map
    behind the panel must stay fully interactive (see josemarluedke/frontile
    issue 447 on GitHub). The separate map-click-to-dismiss beta feature
    (#157, map/index.gts's handleMapClick) is unrelated to this and
    intentionally not merged with it — it only reacts to clicks on the map
    itself, not anywhere outside the panel.

    Deliberately kept to Frontile's own stock Drawer appearance otherwise —
    no shell styling overrides. pointer-events-auto is the one non-stock
    class here, and it is load-bearing rather than decorative: the map's
    overlay slot this Drawer renders into is pointer-events-none so the map
    stays clickable around it, and the panel has to opt back in or clicks
    would pass straight through it too.

    The header row is the one place this still steps outside Drawer's own
    chrome: Frontile's built-in close button is always position: absolute
    (there is no arg to make it a flex sibling of the title), which floats
    it over a separately-centered title rather than sharing a row with it —
    not a bug, just not the layout this panel wants. @allowCloseButton is
    off and @class replaces drawer.Header's own default classes (its
    default id is still what makes aria-labelledby resolve) with a plain
    flex row holding the title and our own close Button side by side.

    (This comment avoids backtick-quoted inline code: 6 or more
    backtick-quoted spans in one hbs comment crash ember-eslint-parser's own
    transform with a RangeError — an upstream parser bug, unrelated to this
    component.) }}
    <Drawer
      data-test-station-panel
      data-test-station-panel-placement={{this.placement}}
      {{trackMediaQuery SIDE_PANEL_QUERY this.setIsSidePanel}}
      @isOpen={{true}}
      @onClose={{this.close}}
      @renderInPlace={{true}}
      @placement={{this.placement}}
      @size="sm"
      @backdrop="none"
      @disableFocusTrap={{true}}
      @disableTransitions={{true}}
      @closeOnOutsideClick={{false}}
      @closeOnEscapeKey={{true}}
      @allowCloseButton={{false}}
      @classes={{hash base="pointer-events-auto"}}
      as |d|
    >
      <d.Header @class="flex items-start justify-between gap-4 px-4 py-2">
        <div class="min-w-0">
          {{#if @station}}
            <StationHeader @station={{@station}} />
          {{/if}}
        </div>
        <Button
          data-test-station-close
          aria-label={{t "common.close"}}
          title={{t "common.close"}}
          @appearance="custom"
          @intent="default"
          @size="xs"
          @onPress={{this.close}}
          class="self-start rounded-md! text-slate-500! transition hover:bg-slate-100 hover:text-slate-900"
        >
          {{! size-5! forces the icon past Frontile's own Button base class
          (its [&_svg]:size-[1em] rule scales icons to the button's own
          font-size), which otherwise silently overrides @size entirely --
          CSS width/height always beats an SVG's own presentation
          attributes, regardless of specificity. }}
          <X @size={{20}} class="size-5!" />
        </Button>
      </d.Header>

      <div class="min-h-0 flex-1 overflow-y-auto">
        {{#if @station}}
          <div class="grid gap-3 px-4 py-3 sm:px-5 md:gap-4 md:py-4">
            <StationMeta @station={{@station}} />
            <StationSummary @station={{@station}} />
            <StationWind @stationId={{@station.id}} />
            <StationAir @stationId={{@station.id}} />
          </div>
        {{/if}}
      </div>
    </Drawer>
  </template>
}
