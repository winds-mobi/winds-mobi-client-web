import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { hash } from '@ember/helper';
import type RouterService from '@ember/routing/router-service';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import { Alert } from 'frontile/status';
import { Drawer } from 'frontile/overlays';
import { Skeleton } from 'frontile/utilities';
import { Request } from '@warp-drive/ember';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import StationFavoriteButton from './favorite-button';
import StationHideButton from './hide-button';
import StationHeader from './header';
import StationMeta from './meta';
import StationSummary from './summary';
import StationAir from './air';
import StationWind from './wind';
import { SIDE_PANEL_QUERY } from 'winds-mobi-client-web/utils/map-padding';
import trackMediaQuery from 'winds-mobi-client-web/modifiers/track-media-query';
import { stationFaviconDataUri } from 'winds-mobi-client-web/utils/station-favicon';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type {
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store.js';

export interface StationIndexSignature {
  Args: {
    stationId: string;
  };
  Element: null;
}

// The Drawer is the one thing here that must never remount: switching
// stations (or a background refresh) must not replay its open animation or
// disturb its drag-to-dismiss state. `<Request>` lives *inside* it instead of
// wrapping it, so only the header/body content it yields is torn down and
// rebuilt on a genuine reload (a real station switch, or the very first
// load) -- the Drawer itself is its parent, untouched by which of
// `<Request>`'s blocks is currently rendering.
export default class StationIndex extends Component<StationIndexSignature> {
  @service declare router: RouterService;
  @service declare settings: SettingsService;
  @service declare store: StoreService;

  // A different station is a new request, so `<Request>` shows `:loading`
  // inside the Drawer rather than remounting it.
  @cached
  get stationRequest() {
    return this.store.request<{ data: Station }>(
      findRecord<Station>('station', this.args.stationId)
    );
  }

  @tracked isSidePanel = false;

  setIsSidePanel = (matches: boolean) => {
    this.isSidePanel = matches;
  };

  get placement(): 'left' | 'bottom' {
    return this.isSidePanel ? 'left' : 'bottom';
  }

  // Clears `station` on whichever surface is already showing this panel
  // (see app/utils/station-detail.ts) -- never a navigation, so it never
  // touches that surface's own camera or view mode.
  @action
  close() {
    this.router.transitionTo({ queryParams: { station: null } });
  }

  faviconDataUri = (station: Station): string => {
    return stationFaviconDataUri(station);
  };

  // `{{in-element}}` destination for the dynamic favicon. While a station is
  // open this renders the only explicit `<link rel="icon">`, so the browser
  // uses it; Glimmer removes it when the panel tears down, falling back to the
  // static `/favicon.ico`. `insertBefore=null` appends rather than clearing the
  // head's existing content.
  get documentHead() {
    return document.head;
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
    issue 447 on GitHub). Closing the panel by clicking the map
    (#157, map/index.gts's handleMapClick) is unrelated to this and
    intentionally not merged with it — it only reacts to clicks on the map
    itself, not anywhere outside the panel. @preventAutoFocus stops Overlay's
    own auto-focus-on-open call too — @disableFocusTrap alone does not (see
    josemarluedke/frontile issue 551); Drawer only started forwarding this arg
    in v0.18.0-alpha.18.

    @variant="flat" keeps every region on one surface; Frontile v0.18's new
    default, "sectioned", adds a black header band and a solid footer that
    this panel's own header row (below) isn't designed against.
    pointer-events-auto is load-bearing rather than decorative: the map's
    overlay slot this Drawer renders into is pointer-events-none so the map
    stays clickable around it, and the panel has to opt back in or clicks
    would pass straight through it too.

    header's own px-4 pr-24 md:px-8 md:pr-24 compacts stock "flat"'s px-8 on
    the narrow mobile bottom-sheet (see each d.Body below for the same
    reasoning), while keeping the close button's own pr-24 lane (the theme's
    separate hasCloseButton compound class) intact at every breakpoint. Both
    px and pr have to be restated per breakpoint bucket, in that order:
    tailwind-merge's padding conflict table only lets a px override remove an
    earlier pr/pl, never the reverse, and an unprefixed pr-24 does not
    survive against a later md:px-8 in the compiled CSS either -- a
    pl-4/md:pl-8-only override, or a bare px-4/md:px-8 with no explicit
    pr-24, silently drops the close button's lane (invisible in the class
    list, only visible in computed style).

    The header uses Drawer's own current API (v0.18 gave d.Header a real
    :actions block and a closeButton rendered out of flow beside it, rather
    than the position: absolute floating button earlier versions had).
    StationHeader's title link goes inside h.Title as ordinary block content;
    StationHideButton and StationFavoriteButton go in :actions, beside the
    close button, per Drawer's own documented pattern for header controls.
    The close button (left at its own default -- @allowCloseButton is on
    unless set otherwise) sits in its own reserved lane regardless and never
    competes with either for width.

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
      @classes={{hash
        base="pointer-events-auto"
        header="px-4 pr-24 md:px-8 md:pr-24"
      }}
      as |d|
    >
      <Request
        @request={{this.stationRequest}}
        @autorefresh="invalid"
        @autorefreshBehavior="refresh"
      >
        <:content as |result|>
          {{pageTitle result.data.name}}

          {{#if this.settings.faviconFollowsStation}}
            {{#in-element this.documentHead insertBefore=null}}
              <link
                rel="icon"
                type="image/svg+xml"
                href={{this.faviconDataUri result.data}}
              />
            {{/in-element}}
          {{/if}}

          <d.Header>
            <:default as |h|>
              <h.Title>
                <StationHeader @station={{result.data}} />
              </h.Title>
            </:default>
            <:actions>
              <StationHideButton @station={{result.data}} />
              <StationFavoriteButton @station={{result.data}} />
            </:actions>
          </d.Header>

          <d.Body @class="px-4 py-0 md:px-8 md:py-6">
            <div class="grid gap-3 md:gap-4">
              <StationMeta @station={{result.data}} />
              <StationSummary @station={{result.data}} />
              <StationWind @stationId={{result.data.id}} />
              <StationAir @stationId={{result.data.id}} />
            </div>
          </d.Body>
        </:content>

        {{! The very first load, or a genuine switch to a different station --
        a background refresh of the same station never reaches this block
        (see CLAUDE.md's "Refresh-in-place" section). }}
        <:loading>
          <d.Header>
            <:default as |h|>
              <h.Title><Skeleton @shape="text" class="w-32" /></h.Title>
            </:default>
          </d.Header>
          <d.Body @class="px-4 py-0 md:px-8 md:py-6">
            <div class="grid gap-3 md:gap-4" data-test-station-loading>
              <Skeleton @shape="rounded" class="h-24" />
              <Skeleton @shape="rounded" class="h-32" />
              <Skeleton @shape="rounded" class="h-48" />
            </div>
          </d.Body>
        </:loading>

        <:error>
          <d.Header />
          <d.Body @class="px-4 py-0 md:px-8 md:py-6">
            <Alert @status="danger" @title={{t "station.requestError"}} />
          </d.Body>
        </:error>
      </Request>
    </Drawer>
  </template>
}
