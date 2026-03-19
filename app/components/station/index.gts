/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
import Component from '@glimmer/component';
import type StoreService from 'winds-mobi-client-web/services/store.js';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import { Request } from '@warp-drive/ember';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { inject as service } from '@ember/service';
import type Owner from '@ember/owner';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import type RouterService from '@ember/routing/router-service';
import { on } from '@ember/modifier';
import StationSummary from './summary';
import StationWinds from './wind';
import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import StationAir from './air';
import { registerDestructor } from '@ember/destroyable';
import { Drawer } from '@frontile/overlays';
import {
  parseMapView,
  serializeMapView,
  type MapQueryParams,
} from 'winds-mobi-client-web/utils/map-view';
import {
  stationTabFromRouteName,
  type StationTab,
} from 'winds-mobi-client-web/utils/station-route';

export interface StationIndexSignature {
  Args: {
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const DRAWER_TRANSITION_DURATION = 200;

export default class StationIndex extends Component<StationIndexSignature> {
  @service declare store: StoreService;
  @service declare router: RouterService;
  @tracked isOpen = true;
  @tracked isMobile = false;

  private mediaQueryList: MediaQueryList;
  private openTimer?: number;

  constructor(owner: Owner, args: StationIndexSignature['Args']) {
    super(owner, args);

    this.mediaQueryList = window.matchMedia('(max-width: 639px)');
    this.isMobile = this.mediaQueryList.matches;
    this.mediaQueryList.addEventListener('change', this.updateViewport);

    registerDestructor(this, () => {
      window.clearTimeout(this.openTimer);
      this.mediaQueryList.removeEventListener('change', this.updateViewport);
    });
  }

  get stationRequest() {
    const options = findRecord<Station>('station', this.args.stationId);
    return this.store.request(options);
  }

  get mapView() {
    return parseMapView(
      this.router.currentRoute?.queryParams as MapQueryParams | undefined
    );
  }

  get currentTab(): StationTab {
    return stationTabFromRouteName(this.router.currentRouteName);
  }

  get isSummaryTab() {
    return this.currentTab === 'summary';
  }

  get isWindsTab() {
    return this.currentTab === 'winds';
  }

  get drawerPlacement() {
    return this.isMobile ? 'bottom' : 'right';
  }

  updateViewport = (event: MediaQueryListEvent) => {
    this.isMobile = event.matches;
  };

  @action
  close() {
    this.isOpen = false;
  }

  @action
  didClose() {
    this.router.transitionTo('map', {
      queryParams: serializeMapView(this.mapView),
    });
  }

  @action
  handleOpen() {
    document.body.style.overflow = '';

    window.clearTimeout(this.openTimer);
    this.openTimer = window.setTimeout(() => {
      const activeElement = document.activeElement;

      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
    }, DRAWER_TRANSITION_DURATION);
  }

  <template>
    <Request @request={{this.stationRequest}}>
      <:loading>
        ---
      </:loading>

      <:content as |result|>
        <Drawer
          @isOpen={{this.isOpen}}
          @onClose={{this.close}}
          @onOpen={{this.handleOpen}}
          @didClose={{this.didClose}}
          @allowCloseButton={{false}}
          @backdrop="none"
          @closeOnOutsideClick={{false}}
          @closeOnEscapeKey={{true}}
          @disableFocusTrap={{true}}
          @transitionDuration={{DRAWER_TRANSITION_DURATION}}
          @placement={{this.drawerPlacement}}
          @size="lg"
          as |drawer|
        >
          <drawer.Header class="border-b border-slate-200 px-4 py-3">
            <div class="flex items-center justify-between gap-4">
              <span
                data-test-station-title
                class="min-w-0 truncate text-xl font-bold"
              >
                {{result.data.name}}
              </span>
              <button
                data-test-station-close
                type="button"
                class="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label={{t "common.close"}}
                title={{t "common.close"}}
                {{on "click" this.close}}
              >
                &times;
              </button>
            </div>
          </drawer.Header>

          <drawer.Body class="min-h-0 p-0">
            <div
              data-test-station-drawer-panel
              data-placement={{this.drawerPlacement}}
              class="flex h-full min-h-0 flex-col"
            >
              <div class="border-b border-gray-200">
                <nav class="-mb-px flex w-full" aria-label={{t "station.tabs"}}>
                  <LinkTo
                    @route="map.station.summary"
                    @model={{@stationId}}
                    data-test-station-tab-summary
                    class="flex-1 border-b-2 px-3 py-4 text-center text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    @activeClass="border-indigo-500 text-indigo-600"
                  >{{t "station.summary.title"}}</LinkTo>
                  <LinkTo
                    @route="map.station.winds"
                    @model={{@stationId}}
                    data-test-station-tab-winds
                    class="flex-1 border-b-2 px-3 py-4 text-center text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    @activeClass="border-indigo-500 text-indigo-600"
                  >{{t "station.wind"}}</LinkTo>
                  <LinkTo
                    @route="map.station.air"
                    @model={{@stationId}}
                    data-test-station-tab-air
                    class="flex-1 border-b-2 px-3 py-4 text-center text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    @activeClass="border-indigo-500 text-indigo-600"
                  >{{t "station.air"}}</LinkTo>
                </nav>
              </div>

              <div class="min-h-0 flex-1 overflow-y-auto">
                {{#if this.isSummaryTab}}
                  <StationSummary @stationId={{@stationId}} />
                {{else if this.isWindsTab}}
                  <StationWinds @stationId={{@stationId}} />
                {{else}}
                  <StationAir @stationId={{@stationId}} />
                {{/if}}
              </div>
            </div>
          </drawer.Body>
        </Drawer>
      </:content>
    </Request>
  </template>
}
