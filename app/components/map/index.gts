import Component from '@glimmer/component';
import { registerDestructor } from '@ember/destroyable';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { query } from 'winds-mobi-client-web/builders/station';
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
  mapViewExceedsRequestThreshold,
  mapViewsEqual,
  parseMapView,
  serializeMapView,
  type MapCoordinate,
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

  @tracked requestedMapView = parseMapView();

  updateRequestedMapView = restartableTask(async (nextView: MapView) => {
    await timeout(STATION_REQUEST_DEBOUNCE_MS);
    this.requestedMapView = nextView;
  });

  private routeEventSource?: EventedRouterService;

  constructor(owner: unknown, args: MapSignature['Args']) {
    super(owner, args);

    this.requestedMapView = this.mapView;
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
  get request(): Future<{ data: Station[] }> {
    const refreshRevision = this.mapRefresh.refreshRevision;

    const options = query<Station>(
      'station',
      {
        limit: 12,
        'near-lat': this.requestedMapView.latitude,
        'near-lon': this.requestedMapView.longitude,
      },
      refreshRevision > 0 ? { backgroundReload: true } : undefined
    );

    return this.requestStore.request<{ data: Station[] }>(options);
  }

  get requestState() {
    return getRequestState(this.request);
  }

  get legendBands(): WindLegendBand[] {
    return [...WIND_COLOUR_BANDS]
      .reverse()
      .map((band) => ({
      backgroundClass: band.backgroundClass,
      label: Number.isFinite(band.max) ? `${band.max}` : `${band.min}+`,
      }));
  }

  get legendTitle() {
    return String(this.intl.t('map.legend.windSpeed'));
  }

  get stations() {
    return this.requestState.isSuccess ? this.requestState.value.data : [];
  }

  @action
  stationSelected(stationId: string) {
    void this.router.transitionTo('map.station', stationId, {
      queryParams: serializeMapView(this.mapView),
    });
  }

  @action
  updateView([longitude, latitude]: MapCoordinate, zoom: number) {
    const nextView = { longitude, latitude, zoom };

    if (mapViewsEqual(this.mapView, nextView)) {
      return;
    }

    this.router.replaceWith({
      queryParams: serializeMapView(nextView),
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
    if (mapViewsEqual(this.requestedMapView, nextView)) {
      this.cancelPendingStationRequest();
      return;
    }

    if (!mapViewExceedsRequestThreshold(this.requestedMapView, nextView)) {
      return;
    }

    this.cancelPendingStationRequest();
    void this.updateRequestedMapView.perform(nextView);
  }

  private cancelPendingStationRequest() {
    void this.updateRequestedMapView.cancelAll();
  }

  <template>
    <div data-test-map-container class="relative h-full w-full">
      <MapCanvas
        data-test-map-canvas
        class="h-full w-full"
        @legendBands={{this.legendBands}}
        @legendTitle={{this.legendTitle}}
        @onStationSelect={{this.stationSelected}}
        @onViewChange={{this.updateView}}
        @selectedStationId={{this.selectedStationId}}
        @stations={{this.stations}}
        @view={{this.mapView}}
      />

      {{#if this.requestState.isPending}}
        <div
          class="pointer-events-none absolute left-4 top-4 rounded-md bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-sm"
        >
          Loading stations…
        </div>
      {{/if}}
    </div>
  </template>
}
