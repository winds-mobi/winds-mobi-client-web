/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { MapboxOverlay } from '@deck.gl/mapbox';
import maplibregl from 'maplibre-gl';

export type DeckLayer = {
  id?: string;
};

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

export type MapInstance = {
  on(event: string, handler: () => void): MapInstance;
  once(event: string, handler: () => void): MapInstance;
  off(event: string, handler: () => void): MapInstance;
  addControl(control: unknown, position?: string): MapInstance;
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
  createNavigationControl(): unknown;
};

const defaultRuntime: MapRuntime = {
  createMap(options) {
    return new maplibregl.Map(options) as unknown as MapInstance;
  },

  createDeckOverlay(options) {
    return new MapboxOverlay(options) as unknown as DeckOverlayInstance;
  },

  createNavigationControl() {
    return new maplibregl.NavigationControl();
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
