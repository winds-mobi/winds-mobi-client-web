import type {
  DeckLayer,
  MapOptions,
  MapRuntime,
} from 'winds-mobi-client-web/utils/map-runtime';

type Handler = () => void;

export class FakeDeckOverlay {
  props: { interleaved: true; layers: DeckLayer[] };

  constructor(props: { interleaved: true; layers: DeckLayer[] }) {
    this.props = props;
  }

  setProps(nextProps: Partial<{ interleaved: true; layers: DeckLayer[] }>) {
    this.props = {
      ...this.props,
      ...nextProps,
    };
  }
}

export class FakeNavigationControl {}

export class FakeMap {
  options: MapOptions;
  controls: Array<{ control: unknown; position?: string }> = [];
  easeToCalls: Array<{
    center: [number, number];
    zoom: number;
    essential: boolean;
  }> = [];
  offCalls: Array<{ event: string; handler: Handler }> = [];
  removed = false;
  loadedState = false;
  center: { lng: number; lat: number };
  zoom: number;

  private handlers = new Map<string, Set<Handler>>();
  private onceHandlers = new Map<string, Set<Handler>>();

  constructor(options: MapOptions) {
    this.options = options;
    this.center = {
      lng: options.center?.[0] ?? 0,
      lat: options.center?.[1] ?? 0,
    };
    this.zoom = options.zoom ?? 0;
  }

  on(event: string, handler: Handler) {
    let handlers = this.handlers.get(event);

    if (!handlers) {
      handlers = new Set();
      this.handlers.set(event, handlers);
    }

    handlers.add(handler);
    return this;
  }

  once(event: string, handler: Handler) {
    let handlers = this.onceHandlers.get(event);

    if (!handlers) {
      handlers = new Set();
      this.onceHandlers.set(event, handlers);
    }

    handlers.add(handler);
    return this;
  }

  off(event: string, handler: Handler) {
    this.offCalls.push({ event, handler });
    this.handlers.get(event)?.delete(handler);
    this.onceHandlers.get(event)?.delete(handler);
    return this;
  }

  emit(event: string) {
    for (const handler of this.handlers.get(event) ?? []) {
      handler();
    }

    for (const handler of this.onceHandlers.get(event) ?? []) {
      handler();
    }

    this.onceHandlers.delete(event);
  }

  addControl(control: unknown, position?: string) {
    this.controls.push({ control, position });
    return this;
  }

  loaded() {
    return this.loadedState;
  }

  setLoaded(value: boolean) {
    this.loadedState = value;
  }

  getCenter() {
    return this.center;
  }

  getZoom() {
    return this.zoom;
  }

  setView(center: [number, number], zoom: number) {
    this.center = { lng: center[0], lat: center[1] };
    this.zoom = zoom;
  }

  easeTo(options: {
    center: [number, number];
    zoom: number;
    essential: boolean;
  }) {
    this.easeToCalls.push(options);
    this.setView(options.center, options.zoom);
  }

  remove() {
    this.removed = true;
  }
}

export function createFakeMapRuntime() {
  const maps: FakeMap[] = [];
  const overlays: FakeDeckOverlay[] = [];

  const runtime: MapRuntime = {
    createMap(options) {
      const map = new FakeMap(options);
      maps.push(map);
      return map;
    },

    createDeckOverlay(options) {
      const overlay = new FakeDeckOverlay(options);
      overlays.push(overlay);
      return overlay as never;
    },

    createNavigationControl() {
      return new FakeNavigationControl() as never;
    },
  };

  return { runtime, maps, overlays };
}
