import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { mapQuery } from 'winds-mobi-client-web/builders/station';
import RefreshingRequest from 'winds-mobi-client-web/components/refreshing-request';
import StationListView from 'winds-mobi-client-web/components/station/list-view';
import onRouteChange from 'winds-mobi-client-web/modifiers/on-route-change';
import onWindowResize from 'winds-mobi-client-web/modifiers/on-window-resize';
import type HiddenStationsService from 'winds-mobi-client-web/services/hidden-stations';
import type {
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store';
import { distanceKm } from 'winds-mobi-client-web/utils/distance';
import {
  boundsFromView,
  roundBoundsForRequest,
  TrackedMapView,
  type MapView,
  type ViewportSize,
} from 'winds-mobi-client-web/utils/map-view';

function currentViewportSize(): ViewportSize {
  return { width: window.innerWidth, height: window.innerHeight };
}

interface AllTemplateSignature {
  Args: { model: string };
}

// How many stations the card view lists. The map draws everything in the area
// (capped by `mapQuery`), but a list of hundreds is not readable — these are
// the closest ones to where the map is pointed.
const CARD_LIST_LIMIT = 10;

// This route owns the data, not how it's drawn: one bounds request feeds
// `StationListView` (shared with Favourites/Hidden), which decides map vs.
// cards vs. compact on its own. The area comes from the routed view, which is
// why the card view works with no map rendered at all.
export default class AllTemplate extends Component<AllTemplateSignature> {
  @service declare router: RouterService;
  @service declare store: StoreService;
  @service('hidden-stations') declare hiddenStations: HiddenStationsService;

  // See `TrackedMapView` for why this needs to be more than
  // `currentMapView(this.router)` read directly (issue #131).
  // `handleRouteChange` keeps it in sync. A `@cached` getter rather than a
  // field initializer, so it's constructed lazily on first access — `@service`
  // fields use `declare` and have no real instance initializer of their own,
  // so reading `this.router` eagerly in a field initializer runs into it "not
  // yet initialized" as far as TypeScript's control-flow analysis can tell.
  @cached
  get trackedMapView(): TrackedMapView {
    return new TrackedMapView(this.router);
  }

  get mapView(): MapView {
    return this.trackedMapView.current;
  }

  @action
  handleRouteChange() {
    this.trackedMapView.sync();
  }

  @tracked private viewportSize: ViewportSize = currentViewportSize();

  handleResize = () => {
    this.viewportSize = currentViewportSize();
  };

  // The stations covering the area the routed view looks at, projected from
  // that view and the window size rather than read back from a rendered map
  // -- so the card view works with no map at all. The view only changes once
  // a pan/zoom has settled (see the map's `handleMoveEnd`), and the bounds
  // snap to the refetch grid so a barely-moved gesture resolves to the same
  // URL. `mapQuery` caps the result at 470 stations.
  @cached
  get stationsRequest() {
    const bounds = roundBoundsForRequest(
      boundsFromView(this.mapView, this.viewportSize)
    );

    return this.store.request<{ data: Station[] }>(
      mapQuery<Station>('station', bounds)
    );
  }

  // Every pan/zoom is a new bounds request, and `<Request>` swaps to
  // `:loading` for each one -- rendering `<StationListView>` inside its blocks
  // would remount the map (a real MapLibre/WebGL instance) on every gesture.
  // So the request goes through the headless `<RefreshingRequest>`, which only
  // commits each resolved list into this latch, and `<StationListView>`
  // renders once, outside it.
  @tracked private lastStations: Station[] = [];

  commitStations = (stations: Station[]) => {
    this.lastStations = stations;
  };

  // Beta feature (#167): a hidden station is never drawn, so nuisance stations
  // overlapping a more useful one (e.g. an SLF snow station right below a
  // Meteoswiss peak station) stop cluttering the map. They stay listed in
  // Settings and on the Hidden page.
  visibleStations = (stations: Station[]): Station[] => {
    return this.hiddenStations.visible(stations);
  };

  // The card view shows the closest stations to where the map is pointed,
  // rather than an arbitrary slice of everything in the area.
  closestStations = (stations: Station[]): Station[] => {
    const { latitude, longitude } = this.mapView;

    return [...stations]
      .sort(
        (a, b) =>
          distanceKm(latitude, longitude, a.latitude, a.longitude) -
          distanceKm(latitude, longitude, b.latitude, b.longitude)
      )
      .slice(0, CARD_LIST_LIMIT);
  };

  <template>
    <div
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
      {{onRouteChange this.router this.handleRouteChange}}
      {{onWindowResize this.handleResize}}
    >
      <RefreshingRequest
        @request={{this.stationsRequest}}
        @onResolve={{this.commitStations}}
      />

      {{#let (this.visibleStations this.lastStations) as |stations|}}
        <StationListView
          @stations={{stations}}
          @cardStations={{this.closestStations stations}}
          @surface="all"
          @mapView={{this.mapView}}
        />
      {{/let}}
    </div>
  </template>
}
