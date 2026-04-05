import Service from '@ember/service';
import type { Map as MaplibreMap } from 'ember-maplibre-gl';
import {
  mapViewFromMap,
  mapViewsEqual,
  type MapView,
} from 'winds-mobi-client-web/utils/map-view';

export default class MapNavigationService extends Service {
  #map?: MaplibreMap;

  get hasMap() {
    return this.#map !== undefined;
  }

  registerMap(map: MaplibreMap) {
    this.#map = map;
  }

  unregisterMap(map: MaplibreMap) {
    if (this.#map === map) {
      this.#map = undefined;
    }
  }

  flyTo(view: MapView) {
    if (!this.#map || mapViewsEqual(mapViewFromMap(this.#map), view)) {
      return;
    }

    this.#map.flyTo({
      center: [view.longitude, view.latitude],
      zoom: view.zoom,
    });
  }
}

declare module '@ember/service' {
  interface Registry {
    'map-navigation': MapNavigationService;
  }
}
