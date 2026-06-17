import Component from '@glimmer/component';
import { array } from '@ember/helper';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { Request } from '@warp-drive/ember';
import { mapQuery } from 'winds-mobi-client-web/builders/station';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { action } from '@ember/object';
import { cached } from '@glimmer/tracking';
import { tracked } from '@glimmer/tracking';
import type RouterService from '@ember/routing/router-service';
import { t } from 'ember-intl';
import MapLibreGL from 'ember-maplibre-gl/components/maplibre-gl';
import type {
  Map as MaplibreMap,
  MapInitOptions,
  StyleSpecification,
} from 'ember-maplibre-gl';
import {
  GeolocateControl,
  NavigationControl,
  TerrainControl,
} from 'maplibre-gl';
import { windLegendBands } from 'winds-mobi-client-web/helpers/wind-to-colour';
import config from 'winds-mobi-client-web/config/environment';
import MapLegend, {
  type WindLegendBand,
} from 'winds-mobi-client-web/components/map/legend';
import MapStationMarker from 'winds-mobi-client-web/components/map/station-marker';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import {
  type RequestResponse,
  responseData,
} from 'winds-mobi-client-web/utils/request-response';
import { DEFAULT_POSITION_OPTIONS } from 'winds-mobi-client-web/utils/location';
import {
  approximateMapBoundsFromView,
  INITIAL_LOCATION_ZOOM,
  mapViewsEqual,
  mapViewFromMap,
  parseMapView,
  quantizeMapViewForRequest,
  serializeMapView,
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

const OSM_SWISS_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osmswissstyle: {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
      tiles: ['https://tile.osm.ch/switzerland/{z}/{x}/{y}.png'],
      tileSize: 256,
      type: 'raster',
    },
    terrainSource: {
      type: 'raster-dem',
      attribution: '© Mapzen terrain tiles',
      encoding: 'terrarium',
      maxzoom: 15,
      tiles: [
        'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'osmswissstyle',
      source: 'osmswissstyle',
      type: 'raster',
    },
  ],
  sky: {},
};

const TEST_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#f1f5f9',
      },
    },
  ],
};

type RequestStore = {
  request<T>(request: unknown): Future<T>;
};

export default class Map extends Component<MapSignature> {
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;
  @service declare router: RouterService;
  @service declare mapRefresh: MapRefreshService;
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;

  @tracked stations: Station[] = [];

  private navigationControl = new NavigationControl({
    showCompass: true,
    visualizePitch: true,
  });
  private geolocateControl = new GeolocateControl({
    positionOptions: DEFAULT_POSITION_OPTIONS,
    // The control's own `_updateCamera` runs `fitBounds(..., fitBoundsOptions)`
    // on every fix. `animate: false` makes it settle instantly so the initial
    // auto-center (and any later manual click) draws straight at the user's
    // location rather than animating a pan/zoom in from the default view (#55).
    fitBoundsOptions: { maxZoom: INITIAL_LOCATION_ZOOM, animate: false },
    showAccuracyCircle: true,
    showUserLocation: true,
    // Locate on demand rather than continuously tracking — we recenter the routed
    // view from the `geolocate` event, and tracking would fight manual panning.
    trackUserLocation: false,
  });

  private terrainControl =
    config.environment === 'test'
      ? undefined
      : new TerrainControl({
          source: 'terrainSource',
          exaggeration: 1,
        });

  get mapView() {
    return parseMapView(
      this.router.currentRoute?.queryParams as MapQueryParams | undefined
    );
  }

  // The station whose detail panel is open (the `map.station/:station_id` route).
  get selectedStationId(): string | undefined {
    let route = this.router.currentRoute;

    while (route) {
      const id = route.params?.['station_id'];

      if (typeof id === 'string') {
        return id;
      }

      route = route.parent;
    }

    return undefined;
  }

  isStationSelected = (station: Station): boolean => {
    return station.id === this.selectedStationId;
  };

  private get requestStore(): RequestStore {
    return this.store as unknown as RequestStore;
  }

  // Quantized so sub-threshold panning resolves to the same value and does not
  // refetch; the URL still tracks every move for the declarative fly-to sync.
  get requestView(): MapView {
    return quantizeMapViewForRequest(this.mapView);
  }

  @cached
  get request(): Future<RequestResponse<Station[]>> | undefined {
    const bounds = approximateMapBoundsFromView(this.requestView);

    this.mapRefresh.lastRefresh;

    const options = mapQuery<Station>('station', bounds, {
      backgroundReload: true,
    });

    const request =
      this.requestStore.request<RequestResponse<Station[]>>(options);

    void request.then((result) => {
      // Ignore a stale response: if the routed view changed while this request
      // was in flight, `this.request` is now a different (cached) Future and its
      // own result will set the stations.
      if (this.request !== request) {
        return;
      }

      this.stations = responseData(result);
    });

    return request;
  }

  get requestState() {
    return this.request ? getRequestState(this.request) : undefined;
  }

  get legendBands(): WindLegendBand[] {
    return windLegendBands();
  }

  get initOptions(): MapInitOptions {
    return {
      bearing: 0,
      center: [this.mapView.longitude, this.mapView.latitude] as [
        number,
        number,
      ],
      dragRotate: true,
      maxPitch: 85,
      pitch: 0,
      style: config.environment === 'test' ? TEST_MAP_STYLE : OSM_SWISS_STYLE,
      touchPitch: true,
      zoom: this.mapView.zoom,
    };
  }

  get markerInitOptions() {
    return {
      anchor: 'center' as const,
      // Pin the marker to the map plane so MapLibre counter-rotates it by the
      // bearing and tilts it by the pitch on every rotate/pitch event. The wind
      // direction stays in the marker's own SVG `rotate(...)`, so the net effect
      // is an arrow that keeps pointing at true compass north and lies flat on
      // the ground in 3D, instead of staying fixed to the screen (#46).
      pitchAlignment: 'map' as const,
      rotationAlignment: 'map' as const,
    };
  }

  markerPosition(station: Station): [number, number] {
    return [station.longitude, station.latitude];
  }

  @action
  stationSelected(station: Station) {
    // Recenter the routed view on the clicked station (keeping the current zoom,
    // so it's a smooth pan) — the declarative fly-to then pans the map and the
    // station ends up centered in the map area that remains beside the detail
    // panel. Centering on the station's geographic coordinate is resize-robust:
    // the panel shrinks the map container and MapLibre re-centers on that point
    // when it resizes, so the station stays centered regardless of timing (#52).
    void this.router.transitionTo('map.station', station.id, {
      queryParams: serializeMapView({
        longitude: station.longitude,
        latitude: station.latitude,
        zoom: this.mapView.zoom,
      }),
    });
  }

  // True on a fresh load where no view is present in the URL, so the routed view
  // still equals the whole-Switzerland default.
  get isInitialDefaultView() {
    return mapViewsEqual(this.mapView, parseMapView());
  }

  @action
  handleMapLoaded() {
    // On a fresh load, ask the map's own geolocation for the user's position and
    // center on it; otherwise the whole-Switzerland default view stays (#32).
    if (this.isInitialDefaultView && config.environment !== 'test') {
      // `mapLoaded` fires before ember-maplibre-gl renders its block and adds the
      // GeolocateControl, so the control isn't on the map yet ("triggered before
      // added to a map"). The addon documents deferring such effectful onMapLoaded
      // work to the next frame, by which point the control is attached.
      requestAnimationFrame(() => this.geolocateControl.trigger());
    }
  }

  @action
  handleGeolocateStart() {
    this.nearbyLocation.beginLocationRequest();
  }

  @action
  handleGeolocate(event: GeolocationPosition) {
    // MapLibre fires `new Event('geolocate', position)`, which spreads the
    // GeolocationPosition fields (coords, timestamp) onto the event itself — there
    // is no `event.data`. The geolocate fly is programmatic (skipped by
    // handleMoveEnd), so center the routed view on the located position here — this
    // is what refetches stations around the user.
    this.nearbyLocation.updateFromPosition(event);

    this.router.replaceWith({
      queryParams: serializeMapView({
        longitude: event.coords.longitude,
        latitude: event.coords.latitude,
        zoom: INITIAL_LOCATION_ZOOM,
      }),
    });
  }

  @action
  handleGeolocateError(event: GeolocationPositionError) {
    this.nearbyLocation.updateFromError(event);
  }

  @action
  handleMoveEnd(event: { target: MaplibreMap; originalEvent?: unknown }) {
    // Only user gestures (pan/zoom) carry `originalEvent`. Programmatic moves — the
    // initial settle, our URL-driven fly-to, the geolocate fly — either already
    // match the routed view or are handled where they originate, and writing back
    // here would drift the URL or mutate router state mid-transition.
    if (!event.originalEvent) {
      return;
    }

    const view = mapViewFromMap(event.target);

    if (mapViewsEqual(this.mapView, view)) {
      return;
    }

    this.router.replaceWith({
      queryParams: serializeMapView(view),
    });
  }

  @action
  handleTerrainChange(event: { target: MaplibreMap }) {
    if (!event.target.getTerrain() || event.target.getPitch() >= 70) {
      return;
    }

    event.target.easeTo({
      pitch: 70,
    });
  }

  get flyToOptions() {
    return {
      center: [this.mapView.longitude, this.mapView.latitude] as [
        number,
        number,
      ],
      zoom: this.mapView.zoom,
    };
  }

  <template>
    <div data-test-map-container class="relative h-full w-full">
      <Request @request={{this.request}}>
        <:content></:content>
      </Request>

      <MapLibreGL
        data-test-map-canvas
        class="h-full w-full"
        @initOptions={{this.initOptions}}
        @mapLoaded={{this.handleMapLoaded}}
        @reuseMaps={{false}}
        as |map|
      >
        <map.call
          @func="flyTo"
          @positionalArguments={{array this.flyToOptions}}
        />

        <map.on @event="moveend" @action={{this.handleMoveEnd}} />
        <map.on @event="terrain" @action={{this.handleTerrainChange}} />
        <map.control
          @control={{this.navigationControl}}
          @position="bottom-right"
        />
        <map.control
          @control={{this.geolocateControl}}
          @position="top-right"
          as |control|
        >
          <control.on
            @event="trackuserlocationstart"
            @action={{this.handleGeolocateStart}}
          />
          <control.on @event="geolocate" @action={{this.handleGeolocate}} />
          <control.on @event="error" @action={{this.handleGeolocateError}} />
        </map.control>
        {{#if this.terrainControl}}
          <map.control @control={{this.terrainControl}} @position="top-right" />
        {{/if}}

        {{#each this.stations as |station|}}
          <map.marker
            @initOptions={{this.markerInitOptions}}
            @lngLat={{this.markerPosition station}}
          >
            <MapStationMarker
              @isSelected={{this.isStationSelected station}}
              @onSelect={{this.stationSelected}}
              @station={{station}}
            />
          </map.marker>
        {{/each}}

        <MapLegend
          class="pointer-events-none absolute left-2.5 top-2.5 z-10"
          @bands={{this.legendBands}}
          @title={{t "map.legend.windSpeed"}}
        />
      </MapLibreGL>

      {{#if this.requestState?.isPending}}
        <div
          class="pointer-events-none absolute left-2.5 top-2.5 rounded-md bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-sm"
        >
          Loading stations…
        </div>
      {{/if}}
    </div>
  </template>
}
