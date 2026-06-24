import Component from '@glimmer/component';
import { array } from '@ember/helper';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { mapQuery } from 'winds-mobi-client-web/builders/station';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { action } from '@ember/object';
import { cached, tracked } from '@glimmer/tracking';
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
import commitResolvedStations from 'winds-mobi-client-web/modifiers/commit-resolved-stations';
import registerLoadingProbe from 'winds-mobi-client-web/modifiers/register-loading-probe';
import measureElement from 'winds-mobi-client-web/modifiers/measure-element';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import {
  type RequestResponse,
  responseData,
} from 'winds-mobi-client-web/utils/request-response';
import { DEFAULT_POSITION_OPTIONS } from 'winds-mobi-client-web/utils/location';
import {
  mapBoundsFromView,
  FOCUS_ZOOM,
  mapViewsEqual,
  mapViewFromMap,
  parseMapView,
  quantizeMapViewForRequest,
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
    fitBoundsOptions: { maxZoom: FOCUS_ZOOM, animate: false },
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

  // The map container's pixel size, measured by the `measureElement` modifier.
  // The request box is derived from it so it covers exactly what the map shows
  // (rather than a fixed ~1024px-wide box that under-fetched larger maps).
  @tracked private viewport?: { width: number; height: number };

  setViewport = (width: number, height: number) => {
    if (this.viewport?.width === width && this.viewport?.height === height) {
      return;
    }

    this.viewport = { width, height };
  };

  // Recreated when the routed view changes (pan/zoom past a threshold), the map
  // is resized, or the shared refresh tick fires — touching `lastRefresh` makes
  // each tick refetch. No `backgroundReload`, so a reload is a real pending
  // request that `loadingProbe` (and the navbar spinner) reflects; the latch keeps
  // the previous markers on screen meanwhile, and refetches return the same cached
  // record identities so markers update in place rather than remounting.
  @cached
  get request(): Future<RequestResponse<Station[]>> | undefined {
    const viewport = this.viewport;

    // Hold the request until the container is measured, so the box matches the
    // real viewport on the first fetch instead of a guessed size.
    if (!viewport) {
      return undefined;
    }

    // Read so each refresh tick invalidates this getter and refetches.
    this.mapRefresh.lastRefresh;

    const bounds = mapBoundsFromView(
      this.requestView,
      viewport.width,
      viewport.height
    );
    const options = mapQuery<Station>('station', bounds);

    return this.requestStore.request<RequestResponse<Station[]>>(options);
  }

  get requestState() {
    return this.request ? getRequestState(this.request) : undefined;
  }

  // Reports to the shared refresh service whether the map is currently loading,
  // so the navbar refresh control can spin while this request is in flight.
  loadingProbe = (): boolean => {
    return this.requestState?.isPending === true;
  };

  // Last successfully-loaded stations, committed by `commitResolvedStations` on
  // each resolve. Holds the markers on screen while a new bounds query loads.
  @tracked private lastStations: Station[] = [];

  commitStations = (stations: Station[]) => {
    this.lastStations = stations;
  };

  // Render the current request's value once it resolves, otherwise fall back to
  // the last loaded set so panning/zooming to new bounds doesn't blink markers
  // off while the new Future is pending. Because `request` is cached on the
  // routed view, `requestState` always reflects the Future for the current view.
  get stations(): Station[] {
    return this.requestState?.isSuccess
      ? responseData(this.requestState.value)
      : this.lastStations;
  }

  get legendBands(): WindLegendBand[] {
    return windLegendBands();
  }

  get initOptions(): MapInitOptions {
    return {
      attributionControl: { compact: true },
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
    // Opens the panel without moving the map. Recentering here used to race the
    // panel-open resize of the *already-mounted* map (#61) — clicking a marker
    // means the station is already visible, so the simplest fix is to not try:
    // the map stays exactly as the user left it, panel opens in place. Omitting
    // queryParams leaves the current routed view untouched (Ember's sticky QPs).
    void this.router.transitionTo('map.station', station.id);
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
      queryParams: {
        longitude: event.coords.longitude,
        latitude: event.coords.latitude,
        zoom: FOCUS_ZOOM,
      },
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
      queryParams: view,
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

  // Cached so the reference is stable across re-renders (stations loading, each
  // refresh tick): the declarative `<map.call @func="flyTo">` re-fires only when
  // this reference changes, so it fires only on a real routed-view change rather
  // than on every render. Without this a refresh tick could re-issue a fly-to
  // mid-gesture, before `moveend` writes the new view back, yanking the camera
  // to the stale routed view. Invalidates when `mapView` (the routed query
  // params) changes, which is exactly when the map should move.
  @cached
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
    <div
      data-test-map-container
      class="relative h-full w-full"
      {{measureElement this.setViewport}}
      {{commitResolvedStations this.requestState this.commitStations}}
      {{registerLoadingProbe this.mapRefresh this.loadingProbe}}
    >
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
    </div>
  </template>
}
