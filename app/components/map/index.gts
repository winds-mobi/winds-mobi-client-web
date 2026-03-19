/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import Component from '@glimmer/component';
import { getRequestState } from '@warp-drive/ember';
import { query } from 'winds-mobi-client-web/builders/station';
import { service } from '@ember/service';
import type StoreService from 'winds-mobi-client-web/services/store.js';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import type LocationService from 'winds-mobi-client-web/services/location.js';
import { action } from '@ember/object';
import { cached } from '@glimmer/tracking';
import type RouterService from '@ember/routing/router-service';
import MaplibreDeck from 'winds-mobi-client-web/modifiers/maplibre-deck';
import {
  buildGpsLayer,
  buildStationLayer,
} from 'winds-mobi-client-web/utils/map-layers';
import type { DeckLayer } from 'winds-mobi-client-web/utils/map-runtime';
import {
  mapViewsEqual,
  parseMapView,
  serializeMapView,
  type MapCoordinate,
  type MapQueryParams,
} from 'winds-mobi-client-web/utils/map-view';
import {
  stationRouteNameForTab,
  stationTabFromRouteName,
} from 'winds-mobi-client-web/utils/station-route';

export interface MapSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class Map extends Component<MapSignature> {
  @service declare store: StoreService;
  @service declare location: LocationService;
  @service declare router: RouterService;

  get mapView() {
    return parseMapView(
      this.router.currentRoute?.queryParams as MapQueryParams | undefined
    );
  }

  @cached
  get request() {
    const options = query<Station>('station', {
      limit: 12,
      'near-lat': this.mapView.latitude,
      'near-lon': this.mapView.longitude,
    });

    return this.store.request(options);
  }

  get requestState() {
    return getRequestState(this.request);
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
        buildStationLayer(this.requestState.value.data, (stationId) =>
          this.stationSelected(stationId)
        )
      );
    }

    return layers;
  }

  @action
  stationSelected(stationId: string) {
    const currentTab = stationTabFromRouteName(this.router.currentRouteName);

    this.router.transitionTo(stationRouteNameForTab(currentTab), stationId, {
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
