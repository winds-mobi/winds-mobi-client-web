import Component from '@glimmer/component';
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
import type { Map as MaplibreMap, StyleSpecification } from 'ember-maplibre-gl';
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
import { DEFAULT_POSITION_OPTIONS } from 'winds-mobi-client-web/utils/location';
import {
  approximateMapBoundsFromView,
  mapBoundsEqual,
  mapBoundsFromMap,
  mapViewsEqual,
  mapViewChangeRequiresStationRefetch,
  mapViewFromMap,
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

type RequestedViewport = {
  bounds: MapBounds;
  view: MapView;
};

type RequestStore = {
  request<T>(request: unknown): Future<T>;
};

type RequestResponse<T> = { data: T } | { content: { data: T } };

function responseData<T>(response: RequestResponse<T>): T {
  return 'data' in response ? response.data : response.content.data;
}

export default class Map extends Component<MapSignature> {
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;
  @service declare router: RouterService;
  @service declare mapRefresh: MapRefreshService;
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;

  @tracked stations: Station[] = [];
  @tracked requestedViewport?: RequestedViewport;
  #requestVersion = 0;

  private navigationControl = new NavigationControl({
    showCompass: true,
    visualizePitch: true,
  });
  private geolocateControl = new GeolocateControl({
    positionOptions: DEFAULT_POSITION_OPTIONS,
    showAccuracyCircle: true,
    showUserLocation: true,
    trackUserLocation: true,
  });
  #didBindGeolocateEvents = false;

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

  private get requestStore(): RequestStore {
    return this.store as unknown as RequestStore;
  }

  @cached
  get request(): Future<RequestResponse<Station[]>> | undefined {
    const requestedViewport = this.requestedViewport ?? {
      bounds: approximateMapBoundsFromView(this.mapView),
      view: this.mapView,
    };

    this.mapRefresh.lastRefresh;

    const options = mapQuery<Station>('station', requestedViewport.bounds, {
      backgroundReload: true,
    });

    const request =
      this.requestStore.request<RequestResponse<Station[]>>(options);
    const requestVersion = ++this.#requestVersion;

    void request.then((result) => {
      if (this.#requestVersion !== requestVersion) {
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

  get initOptions() {
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
    };
  }

  markerPosition(station: Station): [number, number] {
    return [station.longitude, station.latitude];
  }

  @action
  stationSelected(stationId: string) {
    void this.router.transitionTo('map.station', stationId, {
      queryParams: serializeMapView(this.mapView),
    });
  }

  @action
  handleMapLoaded(map: MaplibreMap) {
    this.bindGeolocateEvents();
    this.handleViewportChange(mapViewFromMap(map), mapBoundsFromMap(map));
  }

  @action
  handleMoveEnd(event: { target: MaplibreMap }) {
    this.handleViewportChange(
      mapViewFromMap(event.target),
      mapBoundsFromMap(event.target)
    );
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

  private bindGeolocateEvents() {
    if (this.#didBindGeolocateEvents) {
      return;
    }

    this.#didBindGeolocateEvents = true;

    this.geolocateControl.on('trackuserlocationstart', () => {
      this.nearbyLocation.beginLocationRequest();
    });
    this.geolocateControl.on('geolocate', (event) => {
      this.nearbyLocation.updateFromPosition(event.data);
    });
    this.geolocateControl.on('error', (event) => {
      this.nearbyLocation.updateFromError(event.data);
    });
  }

  private handleViewportChange(view: MapView, bounds: MapBounds) {
    const nextViewport = {
      bounds: normalizeMapBounds(bounds),
      view,
    };

    if (
      !this.requestedViewport ||
      !mapBoundsEqual(this.requestedViewport.bounds, nextViewport.bounds) ||
      mapViewChangeRequiresStationRefetch(
        this.requestedViewport.view,
        nextViewport.view
      )
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
        <map.on @event="moveend" @action={{this.handleMoveEnd}} />
        <map.on @event="terrain" @action={{this.handleTerrainChange}} />
        <map.control
          @control={{this.navigationControl}}
          @position="bottom-right"
        />
        <map.control @control={{this.geolocateControl}} @position="top-right" />
        {{#if this.terrainControl}}
          <map.control @control={{this.terrainControl}} @position="top-right" />
        {{/if}}

        {{#each this.stations as |station|}}
          <map.marker
            @initOptions={{this.markerInitOptions}}
            @lngLat={{this.markerPosition station}}
          >
            <MapStationMarker
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
