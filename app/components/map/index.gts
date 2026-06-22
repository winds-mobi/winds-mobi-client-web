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
  SourceSpecification,
  StyleSpecification,
} from 'ember-maplibre-gl';
import {
  addProtocol,
  GeolocateControl,
  NavigationControl,
  TerrainControl,
} from 'maplibre-gl';
import mlcontour from 'maplibre-contour';
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

// Base map: OpenFreeMap's hosted "Liberty" vector style — a free, no-key,
// worldwide OpenStreetMap basemap (https://openfreemap.org). MapLibre fetches
// this style URL directly, so its sources, glyphs, sprite, and OSM/OpenMapTiles
// attribution all come from OpenFreeMap. Unlike the previous inline raster style
// it carries no DEM source, so the terrain source is attached on map load (see
// handleMapLoaded).
const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Worldwide elevation tiles (AWS Open Data, Terrarium encoding). One DEM, three
// outdoor uses, all client-side off the same tiles: the 3D terrain mesh (toggled
// by the TerrainControl), the hillshade layer, and browser-generated contour
// lines (maplibre-contour). OpenFreeMap's base style ships none of these, so we
// attach them on map load (see handleMapLoaded).
const TERRAIN_DEM_TILE_URL =
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

const TERRAIN_SOURCE_ID = 'terrainSource';
const TERRAIN_SOURCE: SourceSpecification = {
  type: 'raster-dem',
  attribution: '© Mapzen terrain tiles',
  encoding: 'terrarium',
  maxzoom: 15,
  tiles: [TERRAIN_DEM_TILE_URL],
  tileSize: 256,
};

const HILLSHADE_LAYER_ID = 'hillshade';
const CONTOUR_SOURCE_ID = 'contourSource';
const CONTOUR_LINE_LAYER_ID = 'contourLines';
const CONTOUR_LABEL_LAYER_ID = 'contourLabels';
// The vector-tile layer name maplibre-contour emits inside each generated tile.
const CONTOUR_VECTOR_LAYER = 'contours';

// maplibre-contour generates contour vector tiles in a web worker from the same
// Terrarium DEM tiles — no extra tile hosting. The DemSource is a page-level
// singleton: its addProtocol handler is global and only registers once, and the
// same instance is reused if the map is torn down and rebuilt.
let demSource: InstanceType<typeof mlcontour.DemSource> | undefined;

function ensureContourDemSource() {
  if (!demSource) {
    demSource = new mlcontour.DemSource({
      url: TERRAIN_DEM_TILE_URL,
      encoding: 'terrarium',
      maxzoom: 13,
      worker: true,
    });
    demSource.setupMaplibre({ addProtocol });
  }

  return demSource;
}

// Adds hillshading and contour lines + elevation labels to a freshly-loaded map.
// Hillshade and the contour lines go *under* the style's labels (inserted before
// its first symbol layer) so place/road labels stay crisp on top; contour labels
// reuse a font that's already in the style's glyphs so they're guaranteed to
// render. Contours are zoom-gated by the thresholds below, so they only appear
// once you've zoomed into terrain.
function addOutdoorLayers(map: MaplibreMap) {
  const layers = map.getStyle().layers ?? [];
  const firstSymbol = layers.find((layer) => layer.type === 'symbol');
  const beforeId = firstSymbol?.id;
  const contourFont =
    firstSymbol && 'layout' in firstSymbol
      ? (firstSymbol.layout as { 'text-font'?: string[] })['text-font']
      : undefined;

  if (!map.getLayer(HILLSHADE_LAYER_ID)) {
    map.addLayer(
      {
        id: HILLSHADE_LAYER_ID,
        type: 'hillshade',
        source: TERRAIN_SOURCE_ID,
        paint: {
          'hillshade-exaggeration': 0.3,
          'hillshade-shadow-color': '#473b2a',
        },
      },
      beforeId
    );
  }

  if (!map.getSource(CONTOUR_SOURCE_ID)) {
    map.addSource(CONTOUR_SOURCE_ID, {
      type: 'vector',
      tiles: [
        ensureContourDemSource().contourProtocolUrl({
          // [minor, major] metre spacing per zoom; lines appear from z11 in.
          thresholds: {
            11: [200, 1000],
            12: [100, 500],
            13: [100, 500],
            14: [50, 250],
            15: [20, 100],
          },
          elevationKey: 'ele',
          levelKey: 'level',
          contourLayer: CONTOUR_VECTOR_LAYER,
        }),
      ],
      maxzoom: 15,
    });
  }

  if (!map.getLayer(CONTOUR_LINE_LAYER_ID)) {
    map.addLayer(
      {
        id: CONTOUR_LINE_LAYER_ID,
        type: 'line',
        source: CONTOUR_SOURCE_ID,
        'source-layer': CONTOUR_VECTOR_LAYER,
        paint: {
          'line-color': 'rgba(80, 65, 40, 0.45)',
          // Major contour lines (level 1) are drawn heavier than minor ones.
          'line-width': ['match', ['get', 'level'], 1, 1.1, 0.5],
        },
      },
      beforeId
    );
  }

  if (contourFont && !map.getLayer(CONTOUR_LABEL_LAYER_ID)) {
    map.addLayer({
      id: CONTOUR_LABEL_LAYER_ID,
      type: 'symbol',
      source: CONTOUR_SOURCE_ID,
      'source-layer': CONTOUR_VECTOR_LAYER,
      // Only label major lines, to keep the map readable.
      filter: ['>', ['get', 'level'], 0],
      layout: {
        'symbol-placement': 'line',
        'text-size': 10,
        'text-field': ['concat', ['to-string', ['get', 'ele']], ' m'],
        'text-font': contourFont,
      },
      paint: {
        'text-color': 'rgba(60, 48, 30, 0.9)',
        'text-halo-color': 'rgba(255, 255, 255, 0.7)',
        'text-halo-width': 1,
      },
    });
  }
}

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
          source: TERRAIN_SOURCE_ID,
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
      attributionControl: { compact: true },
      bearing: 0,
      center: [this.mapView.longitude, this.mapView.latitude] as [
        number,
        number,
      ],
      dragRotate: true,
      maxPitch: 85,
      pitch: 0,
      style:
        config.environment === 'test' ? TEST_MAP_STYLE : OPENFREEMAP_STYLE_URL,
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
  handleMapLoaded(map: MaplibreMap) {
    // The test style is a bare background with no vector sources or terrain, and
    // tests don't geolocate — nothing to wire up here.
    if (config.environment === 'test') {
      return;
    }

    // OpenFreeMap's base style carries no DEM source, so attach the terrain
    // source the TerrainControl toggles now that the style has loaded, and
    // restore the default atmospheric sky the previous inline style declared.
    if (!map.getSource(TERRAIN_SOURCE_ID)) {
      map.addSource(TERRAIN_SOURCE_ID, TERRAIN_SOURCE);
    }
    map.setSky({});

    // Make the basemap outdoor-usable: hillshading + browser-generated contour
    // lines, both from the DEM source above (see addOutdoorLayers).
    addOutdoorLayers(map);

    // On a fresh load, ask the map's own geolocation for the user's position and
    // center on it; otherwise the whole-Switzerland default view stays (#32).
    if (this.isInitialDefaultView) {
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
