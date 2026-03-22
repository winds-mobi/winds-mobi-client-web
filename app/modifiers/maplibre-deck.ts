import { registerDestructor } from '@ember/destroyable';
import Modifier from 'ember-modifier';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  getMapRuntime,
  type DeckLayer,
  type DeckOverlayInstance,
  type MapInstance,
} from 'winds-mobi-client-web/utils/map-runtime';
import type { WindLegendControlOptions } from 'winds-mobi-client-web/utils/map-legend';
import {
  mapViewsEqual,
  normalizeMapView,
  type MapCoordinate,
  type MapView,
} from 'winds-mobi-client-web/utils/map-view';

const MAP_STYLE_URL =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

type NamedArgs = {
  longitude: number;
  latitude: number;
  zoom: number;
  layers: DeckLayer[];
  legend: WindLegendControlOptions;
  onViewChange: (coords: MapCoordinate, zoom: number) => void;
};

type Signature = {
  Element: HTMLDivElement;
  Args: {
    Positional: [];
    Named: NamedArgs;
  };
};

export default class MaplibreDeckModifier extends Modifier<Signature> {
  private map?: MapInstance;
  private overlay?: DeckOverlayInstance;
  private moveEndHandler?: () => void;
  private cleanupRegistered = false;

  modify(element: HTMLDivElement, _positional: [], named: NamedArgs) {
    const nextView = normalizeMapView({
      longitude: named.longitude,
      latitude: named.latitude,
      zoom: named.zoom,
    });

    element.style.position ||= 'relative';

    if (!this.map) {
      const runtime = getMapRuntime();

      this.overlay = runtime.createDeckOverlay({
        interleaved: true,
        layers: named.layers,
      });

      this.map = runtime.createMap({
        container: element,
        style: MAP_STYLE_URL,
        center: [nextView.longitude, nextView.latitude],
        zoom: nextView.zoom,
        bearing: 0,
        pitch: 0,
        maxPitch: 0,
        dragRotate: false,
        touchPitch: false,
      });

      this.map.once('load', () => {
        if (this.overlay) {
          this.map?.addControl(this.overlay);
        }

        this.map?.addControl(runtime.createNavigationControl(), 'bottom-right');
        this.map?.addControl(
          runtime.createLegendControl(named.legend),
          'top-right'
        );
      });

      this.moveEndHandler = () => {
        if (!this.map) {
          return;
        }

        const center = this.map.getCenter();
        const view = normalizeMapView({
          longitude: center.lng,
          latitude: center.lat,
          zoom: this.map.getZoom(),
        });

        named.onViewChange([view.longitude, view.latitude], view.zoom);
      };

      this.map.on('moveend', this.moveEndHandler);

      if (!this.cleanupRegistered) {
        registerDestructor(this, (instance: MaplibreDeckModifier) => {
          if (instance.map && instance.moveEndHandler) {
            instance.map.off('moveend', instance.moveEndHandler);
          }

          instance.map?.remove();
          instance.map = undefined;
          instance.overlay = undefined;
          instance.moveEndHandler = undefined;
        });
        this.cleanupRegistered = true;
      }

      return;
    }

    this.overlay?.setProps({ layers: named.layers });
    this.syncView(nextView);
  }

  private syncView(nextView: MapView) {
    if (!this.map) {
      return;
    }

    const currentCenter = this.map.getCenter();
    const currentView = normalizeMapView({
      longitude: currentCenter.lng,
      latitude: currentCenter.lat,
      zoom: this.map.getZoom(),
    });

    if (mapViewsEqual(currentView, nextView)) {
      return;
    }

    const applyView = () => {
      this.map?.easeTo({
        center: [nextView.longitude, nextView.latitude],
        zoom: nextView.zoom,
        essential: true,
      });
    };

    if (this.map.loaded()) {
      applyView();
      return;
    }

    void this.map.once('load', applyView);
  }
}
