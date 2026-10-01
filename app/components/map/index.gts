import Component from '@glimmer/component';
import { array, fn } from '@ember/helper';
import { service } from '@ember/service';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import type Owner from '@ember/owner';
import type RouterService from '@ember/routing/router-service';
import { t } from 'ember-intl';
import MapLibreGL from 'ember-maplibre-gl/components/maplibre-gl';
import type { Map as MaplibreMap, MapInitOptions } from 'ember-maplibre-gl';
import {
  GeolocateControl,
  NavigationControl,
  TerrainControl,
  setWorkerUrl,
  type GeolocatePositionEvent,
  type IControl,
} from 'maplibre-gl';
// maplibre-gl v6 is ESM-only and resolves its worker file at runtime via
// `new URL('./maplibre-gl-worker.mjs', import.meta.url)` relative to its own
// module -- that only works unbundled; under Vite/Rollup, `import.meta.url`
// resolves to wherever the bundled chunk is served from, not the real file,
// so the worker 404s and the map never renders any tiles. Every bundler
// consumer needs this one-time `setWorkerUrl` call; must run before any
// `Map` is constructed, so it lives at module scope here rather than inside
// the component. See MapLibre's own v5-to-v6 migration guide.
//
// `?worker&url` (not plain `?url`) is required, not optional: the worker
// file itself has a relative `import ... from "./maplibre-gl-shared.mjs"`
// to a sibling chunk. Plain `?url` just returns a URL to the file copied
// verbatim -- it does not follow or emit that sibling import, so the copy
// in `dist/assets/` still points at a `maplibre-gl-shared.mjs` that was
// never built. That 404s in any real deployment (worked in dev only
// because Vite's dev server resolves the relative import against
// `node_modules` transparently) -- and since our production assets are
// served from a different-origin CDN, the browser reports that 404 as a
// CORS failure instead, which is what made this look CDN/CORS-related
// (issue #164) rather than a missing file. `?worker&url` bundles the
// worker's own dependency chunk into one self-contained file instead, per
// MapLibre's own Vite integration test:
// https://github.com/maplibre/maplibre-gl-js/blob/main/test/integration/bundler/vite-rollup-esbuild/src/main.ts
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { windLegendBands } from 'winds-mobi-client-web/helpers/wind-to-colour';
import config from 'winds-mobi-client-web/config/environment';
import MapLegend, {
  type WindLegendBand,
} from 'winds-mobi-client-web/components/map/legend';
import MapStationMarker from 'winds-mobi-client-web/components/map/station-marker';
import MapUserLocationMarker from 'winds-mobi-client-web/components/map/user-location-marker';
import driveMapCamera from 'winds-mobi-client-web/modifiers/drive-map-camera';
import fitMapToStations from 'winds-mobi-client-web/modifiers/fit-map-to-stations';
import flyToUserLocation from 'winds-mobi-client-web/modifiers/fly-to-user-location';
import trackMediaQuery from 'winds-mobi-client-web/modifiers/track-media-query';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import { flyToCoordinates } from 'winds-mobi-client-web/utils/locate';
import { DEFAULT_POSITION_OPTIONS } from 'winds-mobi-client-web/utils/location';
import { SIDE_PANEL_QUERY } from 'winds-mobi-client-web/utils/map-padding';
import SettledMap from 'winds-mobi-client-web/utils/settled-map';
import {
  OSM_SWISS_STYLE,
  TEST_MAP_STYLE,
} from 'winds-mobi-client-web/utils/map-style';
import {
  FOCUS_ZOOM,
  mapViewCenter,
  mapViewsEqual,
  mapViewFromMap,
  parseMapView,
  type MapView,
} from 'winds-mobi-client-web/utils/map-view';
import { currentStationDetailId } from 'winds-mobi-client-web/utils/station-detail';

setWorkerUrl(workerUrl);

const LEGEND_BANDS: WindLegendBand[] = windLegendBands();

const STATION_MARKER_OPTIONS = {
  anchor: 'center' as const,
  // `cursor-pointer` and `rounded-full` here, not on anything inside
  // `<MapStationMarker>`: this `className` lands on MapLibre's own marker
  // element, the one `<marker.on @event="click">` listens on and the reliable
  // click target (see `map/station-marker.gts`'s top-of-file comment for why
  // click is routed through it rather than a second clickable element). This
  // element shrink-wraps to `<MapStationMarker>`'s own content, so the cursor
  // and the selected-state ring (see the `selectMapMarker` modifier) always
  // match the marker's current size.
  className: 'cursor-pointer rounded-full',
  // Pin the marker to the map plane so MapLibre counter-rotates it by the
  // bearing and tilts it by the pitch on every rotate/pitch event. The wind
  // direction stays in the marker's own SVG `rotate(...)`, so the net effect
  // is an arrow that keeps pointing at true compass north and lies flat on
  // the ground in 3D, instead of staying fixed to the screen (#46).
  pitchAlignment: 'map' as const,
  rotationAlignment: 'map' as const,
};

const USER_LOCATION_MARKER_OPTIONS = {
  anchor: 'center' as const,
  pitchAlignment: 'viewport' as const,
  rotationAlignment: 'viewport' as const,
};

export interface MapSignature {
  Args: {
    // The stations to draw, owned by whichever page is showing them.
    stations: Station[];
    // The routed camera, passed only by the all-stations route itself. Its
    // presence is what makes this *the* routed map: the camera follows the
    // URL rather than the data, and user gestures are written back to it. A
    // favourites or hidden list showing its stations on a map passes no view
    // and gets the opposite: the camera frames the stations and nothing is
    // written back on a gesture. Either way, opening a station (a marker
    // click, or a card's name) only ever sets the `station` query param in
    // place -- see `stationSelected` below.
    mapView?: MapView;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class Map extends Component<MapSignature> {
  @service declare router: RouterService;
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;

  // Wired here rather than declaratively (there's no `<control.on>` block-param
  // equivalent to `<marker.on>`): `GeolocateControl` extends MapLibre's own
  // `Evented`, so it can be listened to directly, and it exists (this field is
  // initialized) well before the map or template does.
  constructor(owner: Owner, args: MapSignature['Args']) {
    super(owner, args);
    this.geolocateControl.on('geolocate', this.handleGeolocate);
  }

  // The buttons and the wind legend live in the top-right corner, the one area
  // neither shape of the station panel covers (a bottom sheet in portrait, a
  // side panel in landscape and on desktop) now that the panel overlays the map
  // instead of shrinking it. MapLibre stacks them there itself, in the order
  // they're added in the template below. The map credit stays where MapLibre
  // puts it, bottom-right, and so is covered by the bottom sheet while a
  // station is open on a phone — visible again as soon as it's closed.
  private navigationControl = new NavigationControl({
    showCompass: true,
    visualizePitch: true,
  });
  private terrainControl =
    config.environment === 'test'
      ? undefined
      : new TerrainControl({
          source: 'terrainSource',
          exaggeration: 1,
        });

  // On every map, routed or fitted -- one fully-capable map means the same
  // controls everywhere, not a lesser one for favourites/hidden. On a fitted
  // map this moves it away from the framed stations, same as a manual pan
  // already can; the next stations refresh reframes it, same as it would
  // undo that pan. `showUserLocation: false` because `MapUserLocationMarker`
  // already draws one, reactively, from `nearbyLocation.coordinates` -- on
  // every map, not just this control's own; two dots would stack otherwise.
  // `fitBoundsOptions.maxZoom` keeps its own first-fix camera move from
  // landing tighter than `FOCUS_ZOOM`, the zoom every other "focus on this"
  // action in the app uses (the `geolocate` handler below re-settles the
  // routed map there anyway, via the same URL round-trip every other focus
  // action takes -- this just keeps that correction small).
  private geolocateControl = new GeolocateControl({
    fitBoundsOptions: { maxZoom: FOCUS_ZOOM },
    positionOptions: DEFAULT_POSITION_OPTIONS,
    showUserLocation: false,
    trackUserLocation: false,
  });

  // The wind legend as a control of MapLibre's own, so it stacks under the
  // buttons natively rather than being positioned against them by hand. The
  // element is created up front instead of inside `onAdd`, so the `{{in-element}}`
  // that fills it with `<MapLegend>` never has to wait on (or react to) MapLibre
  // adopting the control.
  legendElement = Object.assign(document.createElement('div'), {
    // MapLibre's own control class: it floats and spaces the legend in the
    // corner exactly like the buttons above it.
    className: 'maplibregl-ctrl',
  });
  private legendControl: IControl = {
    onAdd: () => this.legendElement,
    onRemove: () => this.legendElement.remove(),
  };

  get isRoutedMap(): boolean {
    return this.args.mapView !== undefined;
  }

  // The camera to open at. For the routed map that's the view from the URL,
  // kept stable across transitions by the route template's `TrackedMapView`
  // (issue #131); otherwise it's only a starting point, since
  // `fitMapToStations` frames the real stations as soon as the map is up.
  get mapView(): MapView {
    return this.args.mapView ?? parseMapView();
  }

  // `driveMapCamera` flies the routed map to the routed view; `fitMapToStations`
  // frames a list's own stations. Exactly one of them ever has a map to act on,
  // so the two camera policies can't fight over the same instance.
  get routedCameraMap(): MaplibreMap | undefined {
    return this.isRoutedMap ? this.mapInstance : undefined;
  }

  get fittedCameraMap(): MaplibreMap | undefined {
    return this.isRoutedMap ? undefined : this.mapInstance;
  }

  // The station whose detail panel is open (the `station` query param).
  get selectedStationId(): string | undefined {
    return currentStationDetailId(this.router);
  }

  get isStationPanelOpen(): boolean {
    return this.selectedStationId !== undefined;
  }

  // Mirrors the overlay slot's own bottom-sheet/side-panel breakpoint (see the
  // slot div's `landscape:`/`md:` classes below), so `driveMapCamera` can pad
  // the map for whichever shape the panel actually takes without measuring it.
  @tracked isSidePanel = false;

  setIsSidePanel = (matches: boolean) => {
    this.isSidePanel = matches;
  };

  isStationSelected = (station: Station): boolean => {
    return station.id === this.selectedStationId;
  };

  get initOptions(): MapInitOptions {
    return {
      attributionControl: { compact: true },
      bearing: 0,
      center: mapViewCenter(this.mapView),
      dragRotate: true,
      maxPitch: 85,
      pitch: 0,
      style: config.environment === 'test' ? TEST_MAP_STYLE : OSM_SWISS_STYLE,
      touchPitch: true,
      zoom: this.mapView.zoom,
    };
  }

  markerPosition(station: Station): [number, number] {
    return [station.longitude, station.latitude];
  }

  @action
  stationSelected(station: Station, event: { originalEvent?: Event }) {
    // A marker lives inside the element MapLibre listens on for map clicks, so
    // this same click also reaches `handleMapClick` below, which would read it
    // as a click on the map itself and close the panel this is about to open.
    // Consuming it here leaves that decision with the element that handled it,
    // rather than having the map guess from the click's target. Only `click` is
    // stopped, so double-clicking a marker still zooms.
    event.originalEvent?.stopPropagation();

    // Opening a station never moves the camera: recentering here used to
    // race the panel-open resize of the *already-mounted* routed map (#61),
    // and either way, clicking a marker means the station is already
    // visible. Setting `station` alone stays on whichever surface is
    // already showing this map (see app/utils/station-detail.ts) instead of
    // navigating anywhere.
    void this.router.transitionTo({ queryParams: { station: station.id } });
  }

  // Clicking the map dismisses the open station panel (#157). Only clicks on the
  // map itself get here: the panel overlays the map as a sibling element, the
  // map controls sit in MapLibre's own control container, station markers
  // consume their click above, and MapLibre suppresses the click that ends a
  // drag — so panning to look around never closes the panel either.
  @action
  handleMapClick() {
    if (!this.isStationPanelOpen) {
      return;
    }

    void this.router.transitionTo({ queryParams: { station: null } });
  }

  // Gates the `flyToUserLocation` modifier below: don't auto-fly during the app's
  // own test suite, where a production geolocation-driven camera move could race a
  // test's own assertions/URL expectations. Everything else -- whether the routed
  // view is still the fresh-load default, whether coordinates are known -- the
  // modifier derives and reacts to itself (it injects `router` and `nearbyLocation`
  // directly), including the case where `coordinates` resolves after this component
  // has already mounted (`ApplicationRoute#beforeModel` doesn't await
  // `nearbyLocation.locateIfPermitted()`).
  get isFlyToUserLocationEnabled() {
    return this.isRoutedMap && config.environment !== 'test';
  }

  @action
  handleMoveEnd(event: { target: MaplibreMap; originalEvent?: unknown }) {
    // Only user gestures (pan/zoom) carry `originalEvent`. Programmatic moves — the
    // initial settle, our URL-driven fly-to, the geolocate fly — either already
    // match the routed view or are handled where they originate, and writing back
    // here would drift the URL or mutate router state mid-transition.
    // Only the routed map owns the URL; a list's map moving never rewrites it.
    if (!event.originalEvent || !this.isRoutedMap) {
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

  // The control's own fix, mirrored into `nearbyLocation` (so distance
  // displays and the marker update the same way a boot-time fix would) and
  // into the URL via the same `flyToCoordinates` the boot-time auto-fly uses
  // -- not just a camera move: `all`'s station list is bounds-sourced from
  // the *routed* view (see `all.gts`'s `stationsRequest`), not the live map, so without this
  // the list would never refetch for the new area.
  handleGeolocate = (event: GeolocatePositionEvent) => {
    this.nearbyLocation.updateFromPosition({ coords: event.coords });
    flyToCoordinates(this.router, this.nearbyLocation);
  };

  @action
  handleTerrainChange(event: { target: MaplibreMap }) {
    if (event.target.getTerrain()) {
      if (event.target.getPitch() < 70) {
        event.target.easeTo({
          pitch: 70,
        });
      }

      return;
    }

    // Turning 3D off via the TerrainControl button only removes the DEM
    // source — MapLibre has no "reset to default" for pitch, so without this
    // the map stays tilted at whatever angle terrain left it at (#100).
    if (event.target.getPitch() !== 0) {
      event.target.easeTo({
        pitch: 0,
      });
    }
  }

  // MapLibre's own instance, for `driveMapCamera` on the overlay slot — which
  // lives outside `<MapLibreGL>`'s block (and so outside the block param that
  // yields it) so the panel renders immediately on a cold deep link instead of
  // waiting for the map to load.
  @tracked private mapInstance?: MaplibreMap;

  handleMapLoaded = (map: MaplibreMap) => {
    this.mapInstance = map;
  };

  <template>
    <div
      data-test-map-container
      class="relative h-full w-full"
      {{flyToUserLocation this.isFlyToUserLocationEnabled}}
      {{fitMapToStations this.fittedCameraMap @stations}}
    >
      <MapLibreGL
        data-test-map-canvas
        class="h-full w-full"
        @initOptions={{this.initOptions}}
        @mapLoaded={{this.handleMapLoaded}}
        @mapLib={{SettledMap}}
        @reuseMaps={{false}}
        as |map|
      >
        <map.on @event="click" @action={{this.handleMapClick}} />
        <map.on @event="moveend" @action={{this.handleMoveEnd}} />
        <map.on @event="terrain" @action={{this.handleTerrainChange}} />
        <map.control @control={{this.legendControl}} @position="top-right" />
        <map.control
          @control={{this.navigationControl}}
          @position="top-right"
        />
        <map.control @control={{this.geolocateControl}} @position="top-right" />
        {{#if this.terrainControl}}
          <map.control @control={{this.terrainControl}} @position="top-right" />
        {{/if}}

        {{#if this.nearbyLocation.coordinates}}
          <map.marker
            @initOptions={{USER_LOCATION_MARKER_OPTIONS}}
            @lngLat={{array
              this.nearbyLocation.coordinates.longitude
              this.nearbyLocation.coordinates.latitude
            }}
          >
            <MapUserLocationMarker />
          </map.marker>
        {{/if}}

        {{#each @stations as |station|}}
          <map.marker
            @initOptions={{STATION_MARKER_OPTIONS}}
            @lngLat={{this.markerPosition station}}
            as |marker|
          >
            <MapStationMarker
              @isSelected={{this.isStationSelected station}}
              @station={{station}}
              @zoom={{this.mapView.zoom}}
            />
            <marker.on
              @event="click"
              @action={{fn this.stationSelected station}}
            />
          </map.marker>
        {{/each}}

        {{#in-element this.legendElement insertBefore=null}}
          <MapLegend
            class="pointer-events-none"
            @bands={{LEGEND_BANDS}}
            @title={{t "map.legend.windSpeed"}}
          />
        {{/in-element}}
      </MapLibreGL>

      {{! The station panel's slot: covers the whole map so the Drawer rendered
      into it (renderInPlace) can fill it and let its own size and placement
      args — Frontile's own sizing, not a size this app invents — decide how
      much space it actually takes (a bottom sheet in portrait, a side panel in
      landscape and on desktop). It overlays the map rather than shrinking it:
      the map's own box never resizes, so MapLibre never re-centres itself into
      a new one, which is what made opening a station visibly heave the whole
      map around (#155). Transparent to pointer events so the covered map
      still pans and zooms while nothing is open. mapPaddingForPlacement
      hardcodes the padding to Frontile's own --drawer-sm size — keep it in
      sync with the Drawer's size argument if that ever changes. }}
      <div
        class="pointer-events-none absolute inset-0 z-20"
        {{trackMediaQuery SIDE_PANEL_QUERY this.setIsSidePanel}}
        {{driveMapCamera
          this.routedCameraMap
          this.mapView
          this.isStationPanelOpen
          this.isSidePanel
        }}
      >
        {{yield}}
      </div>
    </div>
  </template>
}
