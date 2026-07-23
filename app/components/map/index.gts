import Component from '@glimmer/component';
import { array } from '@ember/helper';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { mapQuery } from 'winds-mobi-client-web/builders/station';
import type {
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store.js';
import { action } from '@ember/object';
import { cached, tracked } from '@glimmer/tracking';
import type RouterService from '@ember/routing/router-service';
import { t } from 'ember-intl';
import MapLibreGL from 'ember-maplibre-gl/components/maplibre-gl';
import type { Map as MaplibreMap, MapInitOptions } from 'ember-maplibre-gl';
import { NavigationControl, TerrainControl } from 'maplibre-gl';
import { windLegendBands } from 'winds-mobi-client-web/helpers/wind-to-colour';
import config from 'winds-mobi-client-web/config/environment';
import MapLegend, {
  type WindLegendBand,
} from 'winds-mobi-client-web/components/map/legend';
import MapStationMarker from 'winds-mobi-client-web/components/map/station-marker';
import MapUserLocationMarker from 'winds-mobi-client-web/components/map/user-location-marker';
import commitResolvedStations from 'winds-mobi-client-web/modifiers/commit-resolved-stations';
import onRouteChange from 'winds-mobi-client-web/modifiers/on-route-change';
import registerLoadingProbe from 'winds-mobi-client-web/modifiers/register-loading-probe';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import { responseData } from 'winds-mobi-client-web/utils/request-response';
import {
  OSM_SWISS_STYLE,
  TEST_MAP_STYLE,
} from 'winds-mobi-client-web/utils/map-style';
import {
  boundsFromMap,
  roundBoundsForRequest,
  focusQueryParamsFor,
  mapBoundsEqual,
  mapViewCenter,
  mapViewsEqual,
  mapViewFromMap,
  parseMapView,
  TrackedMapView,
  type MapBounds,
} from 'winds-mobi-client-web/utils/map-view';

export interface MapSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class Map extends Component<MapSignature> {
  @service declare store: StoreService;
  @service declare router: RouterService;
  @service declare mapRefresh: MapRefreshService;
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;

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

  // See `TrackedMapView` for why this needs to be more than `currentMapView(this.router)`
  // read directly (issue #131). `handleRouteChange`, wired to the `onRouteChange`
  // modifier below, is what keeps it in sync with the router. A `@cached` getter
  // rather than a field initializer, so it's constructed lazily on first access —
  // `@service` fields use `declare` and have no real instance initializer of their
  // own, so reading `this.router` eagerly in a field initializer runs into it
  // "not yet initialized" as far as TypeScript's control-flow analysis can tell.
  @cached
  get trackedMapView(): TrackedMapView {
    return new TrackedMapView(this.router);
  }

  get mapView() {
    return this.trackedMapView.current;
  }

  @action
  handleRouteChange() {
    this.trackedMapView.sync();
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

  // The map's current visible bounds in lng/lat, captured from MapLibre's own
  // `getBounds` whenever the map settles (the `idle` event) and snapped to the
  // refetch grid. Reading the live bounds means the request always covers what's
  // actually on screen, including pitched/rotated views; `idle` fires after
  // render, so writing this never clashes with reads in the same render.
  @tracked private requestBounds?: MapBounds;

  captureBounds = (event: { target: MaplibreMap }) => {
    const bounds = roundBoundsForRequest(boundsFromMap(event.target));

    if (mapBoundsEqual(this.requestBounds, bounds)) {
      return;
    }

    this.requestBounds = bounds;
  };

  // Recreated when the visible bounds change or the shared refresh tick fires —
  // touching `lastRefresh` makes each tick refetch. No `backgroundReload`, so a
  // reload is a real pending request that `loadingProbe` (and the navbar spinner)
  // reflects; the latch keeps the previous markers on screen meanwhile, and
  // refetches return the same cached record identities so markers update in place
  // rather than remounting. `mapQuery` caps the result at 470 stations, which
  // bounds the fetch even when a pitched view reaches far toward the horizon.
  @cached
  get request(): Future<{ data: Station[] }> | undefined {
    const bounds = this.requestBounds;

    // Hold the request until the map reports its first bounds (the initial
    // `idle`), so the first fetch already matches the real viewport.
    if (!bounds) {
      return undefined;
    }

    // Read so each refresh tick invalidates this getter and refetches.
    void this.mapRefresh.lastRefresh;

    return this.store.request<{ data: Station[] }>(
      mapQuery<Station>('station', bounds)
    );
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
      center: mapViewCenter(this.mapView),
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

  get userLocationMarkerOptions() {
    return {
      anchor: 'center' as const,
      pitchAlignment: 'viewport' as const,
      rotationAlignment: 'viewport' as const,
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
    // On a fresh load with the default Switzerland view, fly to the user's
    // location if it's already known -- no geolocation request happens here.
    // `ApplicationRoute#beforeModel` already awaits `nearbyLocation.syncPermissionState()`
    // before anything renders, and that already requests the position itself
    // when permission is already granted, so `coordinates` is normally already
    // populated by the time the map ever mounts. `coordinates` being set at all
    // implies granted permission (see `updateFromPosition`), so there's nothing
    // else to check. The user's own pan or the locate button (a fresh, explicit
    // request) handle every other case, including permission not yet granted
    // and a transient geolocation failure at boot.
    if (!this.isInitialDefaultView || config.environment === 'test') return;

    const { coordinates } = this.nearbyLocation;

    if (coordinates) {
      void this.router.replaceWith({
        queryParams: focusQueryParamsFor(coordinates),
      });
    }
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
      center: mapViewCenter(this.mapView),
      zoom: this.mapView.zoom,
    };
  }

  <template>
    <div
      data-test-map-container
      class="relative h-full w-full"
      {{onRouteChange this.router this.handleRouteChange}}
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

        <map.on @event="idle" @action={{this.captureBounds}} />
        <map.on @event="moveend" @action={{this.handleMoveEnd}} />
        <map.on @event="terrain" @action={{this.handleTerrainChange}} />
        <map.control
          @control={{this.navigationControl}}
          @position="bottom-right"
        />
        {{#if this.terrainControl}}
          <map.control @control={{this.terrainControl}} @position="top-right" />
        {{/if}}

        {{#if this.nearbyLocation.coordinates}}
          <map.marker
            @initOptions={{this.userLocationMarkerOptions}}
            @lngLat={{array
              this.nearbyLocation.coordinates.longitude
              this.nearbyLocation.coordinates.latitude
            }}
          >
            <MapUserLocationMarker />
          </map.marker>
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
              @zoom={{this.mapView.zoom}}
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
