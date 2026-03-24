import Component from '@glimmer/component';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { mapQuery } from 'winds-mobi-client-web/builders/station';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { action } from '@ember/object';
import { cached } from '@glimmer/tracking';
import { tracked } from '@glimmer/tracking';
import type RouterService from '@ember/routing/router-service';
import { t } from 'ember-intl';
import eq from 'ember-truth-helpers/helpers/eq';
import MapLibreGL from 'ember-maplibre-gl/components/maplibre-gl';
import type { Map as MaplibreMap, StyleSpecification } from 'ember-maplibre-gl';
import { GeolocateControl, NavigationControl } from 'maplibre-gl';
import { WIND_COLOUR_BANDS } from 'winds-mobi-client-web/helpers/wind-to-colour';
import config from 'winds-mobi-client-web/config/environment';
import MapLegend, {
  type WindLegendBand,
} from 'winds-mobi-client-web/components/map/legend';
import MapStationMarker from 'winds-mobi-client-web/components/map/station-marker';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import {
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
  },
  layers: [
    {
      id: 'osmswissstyle',
      source: 'osmswissstyle',
      type: 'raster',
    },
  ],
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

export default class Map extends Component<MapSignature> {
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;
  @service declare router: RouterService;
  @service declare mapRefresh: MapRefreshService;

  @tracked requestedViewport?: RequestedViewport;

  private navigationControl = new NavigationControl({
    showCompass: false,
  });

  private geolocateControl = new GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    showAccuracyCircle: false,
    showUserLocation: true,
    trackUserLocation: false,
  });

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

  get initOptions() {
    return {
      bearing: 0,
      center: [this.mapView.longitude, this.mapView.latitude] as [number, number],
      dragRotate: false,
      maxPitch: 0,
      pitch: 0,
      style: config.environment === 'test' ? TEST_MAP_STYLE : OSM_SWISS_STYLE,
      touchPitch: false,
      zoom: this.mapView.zoom,
    };
  }

  get markerInitOptions() {
    return {
      anchor: 'center' as const,
    };
  }

  get stations() {
    return this.requestState?.isSuccess ? this.requestState.value.data : [];
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
    this.handleViewportChange(mapViewFromMap(map), mapBoundsFromMap(map));
  }

  @action
  handleMoveEnd(event: { target: MaplibreMap }) {
    this.handleViewportChange(
      mapViewFromMap(event.target),
      mapBoundsFromMap(event.target)
    );
  }

  private handleViewportChange(view: MapView, bounds: MapBounds) {
    const nextViewport = {
      bounds: normalizeMapBounds(bounds),
      view,
    };

    if (
      !this.requestedViewport ||
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
      <MapLibreGL
        data-test-map-canvas
        class="h-full w-full"
        @initOptions={{this.initOptions}}
        @mapLoaded={{this.handleMapLoaded}}
        @reuseMaps={{false}}
        as |map|
      >
        <map.on @event="moveend" @action={{this.handleMoveEnd}} />
        <map.control
          @control={{this.navigationControl}}
          @position="bottom-right"
        />
        <map.control @control={{this.geolocateControl}} @position="top-right" />

        {{#each this.stations as |station|}}
          <map.marker
            @initOptions={{this.markerInitOptions}}
            @lngLat={{this.markerPosition station}}
          >
            <MapStationMarker
              @isSelected={{eq station.id this.selectedStationId}}
              @onSelect={{this.stationSelected}}
              @station={{station}}
            />
          </map.marker>
        {{/each}}

        <MapLegend @bands={{this.legendBands}} @title={{t "map.legend.windSpeed"}} />
      </MapLibreGL>

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
