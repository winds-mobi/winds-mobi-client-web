import Component from '@glimmer/component';
import { registerDestructor } from '@ember/destroyable';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { mapQuery } from 'winds-mobi-client-web/builders/station';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { action } from '@ember/object';
import { cached } from '@glimmer/tracking';
import { tracked } from '@glimmer/tracking';
import type RouterService from '@ember/routing/router-service';
import { type IntlService } from 'ember-intl';
import { restartableTask, timeout } from 'ember-concurrency';
import { WIND_COLOUR_BANDS } from 'winds-mobi-client-web/helpers/wind-to-colour';
import MapCanvas from 'winds-mobi-client-web/components/map/canvas';
import type { WindLegendBand } from 'winds-mobi-client-web/components/map/legend';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import {
  isMapRoute,
  mapViewsEqual,
  mapViewExceedsRequestThreshold,
  normalizeMapBounds,
  parseMapView,
  serializeMapView,
  type MapBounds,
  type MapQueryParams,
  type MapView,
} from 'winds-mobi-client-web/utils/map-view';

export interface MapSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

const STATION_REQUEST_DEBOUNCE_MS = 250;

type RequestedViewport = {
  bounds: MapBounds;
  view: MapView;
};

type RouteDidChangeHandler = () => void;

type EventedRouterService = RouterService & {
  on(event: 'routeDidChange', handler: RouteDidChangeHandler): void;
  off(event: 'routeDidChange', handler: RouteDidChangeHandler): void;
};

type RequestStore = {
  request<T>(request: unknown): Future<T>;
};

export default class Map extends Component<MapSignature> {
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;
  @service declare router: RouterService;
  @service declare intl: IntlService;
  @service declare mapRefresh: MapRefreshService;

  @tracked requestedViewport?: RequestedViewport;
  @tracked latestViewport?: RequestedViewport;

  updateRequestedViewport = restartableTask(
    async (nextViewport: RequestedViewport) => {
      await timeout(STATION_REQUEST_DEBOUNCE_MS);
      this.requestedViewport = nextViewport;
    }
  );

  private routeEventSource?: EventedRouterService;

  constructor(owner: unknown, args: MapSignature['Args']) {
    super(owner, args);
    this.routeEventSource = this.router as EventedRouterService;
    this.routeEventSource.on('routeDidChange', this.handleRouteDidChange);

    registerDestructor(this, () => {
      this.cancelPendingStationRequest();
      this.routeEventSource?.off('routeDidChange', this.handleRouteDidChange);
      this.routeEventSource = undefined;
    });
  }

  get selectedStationId() {
    return this.router.currentRoute?.params['station_id'];
  }

  get mapView() {
    return parseMapView(
      this.router.currentRoute?.queryParams as MapQueryParams | undefined
    );
  }

  private get requestStore(): RequestStore {
    return this.store as unknown as RequestStore;
  }

  @cached
  get request(): Future<{ data: Station[] }> | undefined {
    if (!this.requestedViewport) {
      return undefined;
    }

    const refreshRevision = this.mapRefresh.refreshRevision;

    const options = mapQuery<Station>(
      'station',
      this.requestedViewport.bounds,
      refreshRevision > 0 ? { backgroundReload: true } : undefined
    );

    return this.requestStore.request<{ data: Station[] }>(options);
  }

  get requestState() {
    return this.request ? getRequestState(this.request) : undefined;
  }

  get legendBands(): WindLegendBand[] {
    return [...WIND_COLOUR_BANDS].reverse().map((band) => ({
      backgroundClass: band.backgroundClass,
      label: Number.isFinite(band.max) ? `${band.max}` : `${band.min}+`,
    }));
  }

  get legendTitle() {
    return String(this.intl.t('map.legend.windSpeed'));
  }

  get stations() {
    return this.requestState?.isSuccess ? this.requestState.value.data : [];
  }

  @action
  stationSelected(stationId: string) {
    void this.router.transitionTo('map.station', stationId, {
      queryParams: serializeMapView(this.mapView),
    });
  }

  @action
  handleViewportChange(view: MapView, bounds: MapBounds) {
    const nextViewport = {
      bounds: normalizeMapBounds(bounds),
      view,
    };

    this.latestViewport = nextViewport;

    if (
      !this.requestedViewport &&
      mapViewsEqual(this.mapView, nextViewport.view)
    ) {
      this.requestedViewport = nextViewport;
    }

    if (mapViewsEqual(this.mapView, nextViewport.view)) {
      return;
    }

    this.router.replaceWith({
      queryParams: serializeMapView(nextViewport.view),
    });
  }

  private handleRouteDidChange = () => {
    if (!isMapRoute(this.router.currentRouteName)) {
      this.cancelPendingStationRequest();
      return;
    }

    this.scheduleStationRequest(this.mapView);
  };

  private scheduleStationRequest(nextView: MapView) {
    if (
      this.requestedViewport &&
      mapViewsEqual(this.requestedViewport.view, nextView)
    ) {
      this.cancelPendingStationRequest();
      return;
    }

    if (
      this.requestedViewport &&
      !mapViewExceedsRequestThreshold(this.requestedViewport.view, nextView)
    ) {
      return;
    }

    const latestViewport = this.latestViewport;

    if (!latestViewport || !mapViewsEqual(latestViewport.view, nextView)) {
      return;
    }

    this.cancelPendingStationRequest();
    void this.updateRequestedViewport.perform(latestViewport);
  }

  private cancelPendingStationRequest() {
    void this.updateRequestedViewport.cancelAll();
  }

  <template>
    <div data-test-map-container class="relative h-full w-full">
      <MapCanvas
        data-test-map-canvas
        class="h-full w-full"
        @legendBands={{this.legendBands}}
        @legendTitle={{this.legendTitle}}
        @onStationSelect={{this.stationSelected}}
        @onViewportChange={{this.handleViewportChange}}
        @selectedStationId={{this.selectedStationId}}
        @stations={{this.stations}}
        @view={{this.mapView}}
      />

      {{#if this.requestState?.isPending}}
        <div
          class="pointer-events-none absolute left-4 top-4 rounded-md bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-sm"
        >
          Loading stations…
        </div>
      {{/if}}
    </div>
  </template>
}
