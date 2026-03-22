import Component from '@glimmer/component';
import { action } from '@ember/object';
import { modifier } from 'ember-modifier';
import eq from 'ember-truth-helpers/helpers/eq';
import MapLibreGL from 'ember-maplibre-gl/components/maplibre-gl';
import type { Map as MaplibreMap, StyleSpecification } from 'ember-maplibre-gl';
import {
  GeolocateControl,
  NavigationControl,
  type IControl,
} from 'maplibre-gl';
import type { Station } from 'winds-mobi-client-web/services/store';
import config from 'winds-mobi-client-web/config/environment';
import {
  mapViewsEqual,
  normalizeMapBounds,
  normalizeMapView,
  type MapBounds,
  type MapView,
} from 'winds-mobi-client-web/utils/map-view';
import MapLegend, {
  type WindLegendBand,
} from 'winds-mobi-client-web/components/map/legend';
import MapStationMarker from 'winds-mobi-client-web/components/map/station-marker';

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

type MapConstructor = new (...args: unknown[]) => MaplibreMap;

export interface MapCanvasSignature {
  Args: {
    geolocateControl?: IControl;
    legendBands: WindLegendBand[];
    legendTitle: string;
    mapLib?: MapConstructor;
    navigationControl?: IControl;
    onStationSelect: (stationId: string) => void;
    onViewportChange: (view: MapView, bounds: MapBounds) => void;
    selectedStationId?: string;
    stations: Station[];
    view: MapView;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLDivElement;
}

export default class MapCanvas extends Component<MapCanvasSignature> {
  private element?: HTMLDivElement;
  private mapInstance?: MaplibreMap;
  private pendingExternalViewKey?: string;

  private defaultNavigationControl = new NavigationControl({
    showCompass: false,
  });

  private defaultGeolocateControl = new GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    showAccuracyCircle: false,
    showUserLocation: true,
    trackUserLocation: false,
  });

  get initOptions() {
    return {
      bearing: 0,
      center: [this.args.view.longitude, this.args.view.latitude] as [
        number,
        number,
      ],
      dragRotate: false,
      maxPitch: 0,
      pitch: 0,
      style: config.environment === 'test' ? TEST_MAP_STYLE : OSM_SWISS_STYLE,
      touchPitch: false,
      zoom: this.args.view.zoom,
    };
  }

  get navigationControl() {
    return this.args.navigationControl ?? this.defaultNavigationControl;
  }

  get geolocateControl() {
    return this.args.geolocateControl ?? this.defaultGeolocateControl;
  }

  get markerInitOptions() {
    return {
      anchor: 'center' as const,
    };
  }

  private viewKey(view: MapView) {
    return `${view.longitude}:${view.latitude}:${view.zoom}`;
  }

  private currentMapView(map: MaplibreMap): MapView {
    const center = map.getCenter();

    return normalizeMapView({
      latitude: center.lat,
      longitude: center.lng,
      zoom: map.getZoom(),
    });
  }

  private currentMapBounds(map: MaplibreMap): MapBounds {
    const bounds = map.getBounds();
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();

    return normalizeMapBounds({
      northEast: [northEast.lng, northEast.lat],
      southWest: [southWest.lng, southWest.lat],
    });
  }

  markerPosition(station: Station): [number, number] {
    return [station.longitude, station.latitude];
  }

  registerElement = modifier((element: HTMLDivElement) => {
    this.element = element;

    if (this.mapInstance) {
      (
        element as HTMLDivElement & { __maplibreMap?: MaplibreMap }
      ).__maplibreMap = this.mapInstance;
    }

    return () => {
      if (this.element === element) {
        delete (element as HTMLDivElement & { __maplibreMap?: MaplibreMap })
          .__maplibreMap;
        this.element = undefined;
      }
    };
  });

  @action
  handleMapLoaded(map: MaplibreMap) {
    this.mapInstance = map;
    if (this.element) {
      (
        this.element as HTMLDivElement & {
          __maplibreMap?: MaplibreMap;
        }
      ).__maplibreMap = map;
    }

    this.args.onViewportChange(
      this.currentMapView(map),
      this.currentMapBounds(map)
    );
  }

  @action
  handleMoveEnd(event: { target: MaplibreMap }) {
    const view = this.currentMapView(event.target);
    const bounds = this.currentMapBounds(event.target);

    if (this.pendingExternalViewKey === this.viewKey(view)) {
      this.pendingExternalViewKey = undefined;
    }

    this.args.onViewportChange(view, bounds);
  }

  syncMapView = (map: MaplibreMap | undefined, view: MapView) => {
    if (!map) {
      return;
    }

    const nextView = normalizeMapView(view);
    const currentView = this.currentMapView(map);
    const nextViewKey = this.viewKey(nextView);

    if (mapViewsEqual(currentView, nextView)) {
      this.pendingExternalViewKey = undefined;
      return;
    }

    if (this.pendingExternalViewKey === nextViewKey || map.isMoving()) {
      return;
    }

    this.pendingExternalViewKey = nextViewKey;
    map.flyTo({
      center: [nextView.longitude, nextView.latitude],
      essential: true,
      zoom: nextView.zoom,
    });
  };

  <template>
    <div ...attributes {{this.registerElement}}>
      <MapLibreGL
        @initOptions={{this.initOptions}}
        @mapLib={{@mapLib}}
        @mapLoaded={{this.handleMapLoaded}}
        @reuseMaps={{false}}
        class="h-full w-full"
        as |map|
      >
        {{this.syncMapView map.instance @view}}

        <map.on @event="moveend" @action={{this.handleMoveEnd}} />
        <map.control
          @control={{this.navigationControl}}
          @position="bottom-right"
        />
        <map.control @control={{this.geolocateControl}} @position="top-right" />

        {{#each @stations as |station|}}
          <map.marker
            @initOptions={{this.markerInitOptions}}
            @lngLat={{this.markerPosition station}}
          >
            <MapStationMarker
              @isSelected={{eq station.id @selectedStationId}}
              @onSelect={{@onStationSelect}}
              @station={{station}}
            />
          </map.marker>
        {{/each}}

        <MapLegend @bands={{@legendBands}} @title={{@legendTitle}} />
      </MapLibreGL>
    </div>
  </template>
}
