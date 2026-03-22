import Component from '@glimmer/component';
import { registerDestructor } from '@ember/destroyable';
import { getRequestState } from '@warp-drive/ember';
import { query } from 'winds-mobi-client-web/builders/station';
import { service } from '@ember/service';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import type LocationService from 'winds-mobi-client-web/services/location.js';
import { action } from '@ember/object';
import { cached } from '@glimmer/tracking';
import { tracked } from '@glimmer/tracking';
import type RouterService from '@ember/routing/router-service';
import { type IntlService } from 'ember-intl';
import { cancel, later } from '@ember/runloop';
import MaplibreDeck from 'winds-mobi-client-web/modifiers/maplibre-deck';
import {
  buildGpsLayer,
  buildStationLayer,
} from 'winds-mobi-client-web/utils/map-layers';
import type { DeckLayer } from 'winds-mobi-client-web/utils/map-runtime';
import { buildWindLegendBands } from 'winds-mobi-client-web/utils/map-legend';
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
  Args: {};
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

export default class Map extends Component<MapSignature> {
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;
  @service declare location: LocationService;
  @service declare router: RouterService;
  @service declare intl: IntlService;

  @tracked requestedMapView = parseMapView();

  legendBands = buildWindLegendBands();
  private routeEventSource?: EventedRouterService;
  private stationRequestTimer?: ReturnType<typeof later>;

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

  @cached
  get request() {
    const options = query<Station>('station', {
      limit: 12,
      'near-lat': this.requestedMapView.latitude,
      'near-lon': this.requestedMapView.longitude,
    });

    return this.store.request(options) as Promise<{ data: Station[] }>;
  }

  get requestState() {
    return getRequestState(this.request);
  }

  get legend() {
    return {
      bands: this.legendBands,
      title: String(this.intl.t('map.legend.windSpeed')),
    };
  }

  get layers() {
    const layers: DeckLayer[] = [];

    if (this.location.gps) {
      layers.push(
        buildGpsLayer([this.location.gps.longitude, this.location.gps.latitude])
      );
    }

    if (this.requestState.isSuccess) {
      layers.push(
        buildStationLayer(
          this.requestState.value.data,
          this.selectedStationId,
          (stationId) => this.stationSelected(stationId)
        )
      );
    }

    return layers;
  }

  @action
  stationSelected(stationId: string) {
    this.router.transitionTo('map.station', stationId, {
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
    this.stationRequestTimer = later(
      this,
      this.commitRequestedMapView,
      nextView,
      STATION_REQUEST_DEBOUNCE_MS
    );
  }

  private commitRequestedMapView(nextView: MapView) {
    this.stationRequestTimer = undefined;
    this.requestedMapView = nextView;
  }

  private cancelPendingStationRequest() {
    if (!this.stationRequestTimer) {
      return;
    }

    cancel(this.stationRequestTimer);
    this.stationRequestTimer = undefined;
  }

  <template>
    <div data-test-map-container class="relative h-full w-full">
      <div
        data-test-map-canvas
        class="h-full w-full"
        {{MaplibreDeck
          longitude=this.mapView.longitude
          latitude=this.mapView.latitude
          zoom=this.mapView.zoom
          layers=this.layers
          legend=this.legend
          onViewChange=this.updateView
        }}
      ></div>

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
