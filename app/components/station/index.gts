import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { hash } from '@ember/helper';
import type RouterService from '@ember/routing/router-service';
import { Drawer } from 'frontile/overlays';
import StationFavoriteButton from './favorite-button';
import StationHeader from './header';
import StationMeta from './meta';
import StationSummary from './summary';
import StationAir from './air';
import StationWind from './wind';
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
    itself, not anywhere outside the panel. @preventAutoFocus stops Overlay's
    own auto-focus-on-open call too — @disableFocusTrap alone does not (see
    josemarluedke/frontile issue 551); Drawer only started forwarding this arg
    in v0.18.0-alpha.18.

    Deliberately kept to Frontile's own stock Drawer appearance otherwise —
    no shell styling overrides beyond d.Body's own padding (below).
    @variant="flat" keeps every region on one surface; Frontile v0.18's new
    default, "sectioned", adds a black header band and a solid footer that
    this panel's own header row (below) isn't designed against.
    pointer-events-auto is load-bearing rather than decorative: the map's
    overlay slot this Drawer renders into is pointer-events-none so the map
    stays clickable around it, and the panel has to opt back in or clicks
    would pass straight through it too.

    The header now uses Drawer's own current API (v0.18 gave d.Header a real
    :actions block and a closeButton rendered out of flow beside it, rather
    than the position: absolute floating button earlier versions had) — no
    custom header row needed anymore. StationHeader's title link goes inside
    h.Title as ordinary block content; StationFavoriteButton goes in :actions,
    beside the close button, per Drawer's own documented pattern for header
    controls — it decides for itself whether to render anything (see its own
    comment), so this component doesn't need to know about the favourites
    feature gate at all. The close button (left at its own default --
    @allowCloseButton is on unless set otherwise) sits in its own reserved
    lane regardless and never competes with either for width.

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
      @variant="flat"
      @size="sm"
      @backdrop="none"
      @disableFocusTrap={{true}}
      @preventAutoFocus={{true}}
      @closeOnOutsideClick={{false}}
      @closeOnEscapeKey={{true}}
      @classes={{hash base="pointer-events-auto"}}
      as |d|
    >
      {{! d.Header's block params live on <:default as |h|>, not on the
      outer tag -- once any explicit named block is used (:actions here),
      the outer <d.Header as |h|> form is invalid. @station is passed
      through unguarded -- StationHeader and StationFavoriteButton each
      take an optional station and render nothing until it's present, so
      this component doesn't need to know about their internals. }}
      <d.Header>
        <:default as |h|>
          <h.Title>
            <StationHeader @station={{@station}} />
          </h.Title>
        </:default>
        <:actions>
          <StationFavoriteButton @station={{@station}} />
        </:actions>
      </d.Header>

      {{! d.Body carries data-drawer-body, which dragToDismiss's
      scrollSelector (see Drawer's own drag-to-dismiss modifier) needs to
      tell a scroll inside this content from a dismiss drag -- without it,
      every downward drag reads as "no scroll container found here" and
      commits to dismissing, even mid-scroll through the wind/air charts.
      Drag-to-close defaults to on for @placement="bottom", which this panel
      uses on mobile, so this isn't cosmetic. min-h-0 overrides the theme's
      plain grow: a flex child needs it to actually shrink and let
      overflow-y-auto scroll, rather than growing to fit its content. px-0/
      py-0 override the theme's own px-8/py-6 -- this panel's padding lives
      on the content grid below instead, sized to match its own px-4/py-3
      rather than a full dialog's wider padding. This has to be @class (the
      component's own twMerge-aware arg), not a plain class="..." attribute
      -- the latter goes through ...attributes and Ember's own splattribute
      merge just concatenates it onto the component's classes with no
      dedup, so px-8/py-6 would silently keep winning the cascade. }}
      <d.Body @class="min-h-0 px-0 py-0">
        {{#if @station}}
          <div class="grid gap-3 px-4 py-3 sm:px-5 md:gap-4 md:py-4">
            <StationMeta @station={{@station}} />
            <StationSummary @station={{@station}} />
            <StationWind @stationId={{@station.id}} />
            <StationAir @stationId={{@station.id}} />
          </div>
        {{/if}}
      </d.Body>
    </Drawer>
  </template>
}
