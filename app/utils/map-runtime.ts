import { MapboxOverlay } from '@deck.gl/mapbox';
import maplibregl from 'maplibre-gl';
import {
  buildWindLegendControlElement,
  type WindLegendControlOptions,
} from 'winds-mobi-client-web/utils/map-legend';

export type DeckLayer = {
  id?: string;
};

export type MapControlPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type MapOptions = {
  container: HTMLElement;
  style: string;
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  maxPitch?: number;
  dragRotate?: boolean;
  touchPitch?: boolean;
};

export type MapControl = {
  onAdd(map: MapInstance): HTMLElement;
  onRemove(): void;
};

export type MapInstance = {
  on(event: string, handler: () => void): MapInstance;
  once(event: string, handler: () => void): MapInstance;
  off(event: string, handler: () => void): MapInstance;
  addControl(control: unknown, position?: MapControlPosition): MapInstance;
  remove(): void;
  loaded(): boolean;
  getCenter(): { lng: number; lat: number };
  getZoom(): number;
  easeTo(options: {
    center: [number, number];
    zoom: number;
    essential: boolean;
  }): void;
};

export type DeckOverlayInstance = {
  setProps(props: Partial<{ interleaved: true; layers: DeckLayer[] }>): void;
};

export type MapRuntime = {
  createMap(options: MapOptions): MapInstance;
  createDeckOverlay(options: {
    interleaved: true;
    layers: DeckLayer[];
  }): DeckOverlayInstance;
  createNavigationControl(): MapControl;
  createLegendControl(options: WindLegendControlOptions): MapControl;
};

function createWindLegendControl(
  options: WindLegendControlOptions
): MapControl {
  let element: HTMLElement | undefined;

  return {
    onAdd() {
      element = buildWindLegendControlElement(options);
      return element;
    },

    onRemove() {
      element?.remove();
      element = undefined;
    },
  };
}

const defaultRuntime: MapRuntime = {
  createMap(options) {
    return new maplibregl.Map(options) as unknown as MapInstance;
  },

  createDeckOverlay(options) {
    return new MapboxOverlay(options) as unknown as DeckOverlayInstance;
  },

  createNavigationControl() {
    return new maplibregl.NavigationControl() as unknown as MapControl;
  },

  createLegendControl(options) {
    return createWindLegendControl(options);
  },
};

let runtime: MapRuntime = defaultRuntime;

export function getMapRuntime() {
  return runtime;
}

export function setMapRuntimeForTest(nextRuntime: MapRuntime) {
  runtime = nextRuntime;
}

export function resetMapRuntimeForTest() {
  runtime = defaultRuntime;
}
