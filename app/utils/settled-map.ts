import { waitForPromise } from '@ember/test-waiters';
import {
  Map as MaplibreMap,
  type MapOptions,
  type PaddingOptions,
} from 'maplibre-gl';

// A MapLibre map that also takes a `padding` at construction, which MapLibre's
// own options don't: setting it before the first frame is drawn means a map
// that opens with the station panel already shows the routed view beside the
// panel, instead of drawing it once in the middle of the whole map and then
// jumping (see `drive-map-camera`).
//
// It also tells Ember's test waiters while it's busy: from
// construction until it first goes idle (style, tiles and markers in place),
// and from every camera move until it settles again. Loading and camera
// animations run outside anything Ember tracks, so without this `settled()`
// would resolve while the map is still getting there. `waitForPromise` is a
// no-op in production builds.
class SettledMap extends MaplibreMap {
  // Resolves once the map is removed, so a wait still pending then (the map
  // never went idle) ends with it instead of holding `settled()` forever.
  private markRemoved!: () => void;
  private removed = new Promise<void>((resolve) => {
    this.markRemoved = resolve;
  });

  constructor({
    padding,
    ...options
  }: MapOptions & { padding?: PaddingOptions }) {
    super(options);

    if (padding) {
      this.setPadding(padding);
    }

    this.waitUntilIdle();
    this.on('movestart', () => this.waitUntilIdle());
  }

  private waitUntilIdle() {
    void waitForPromise(
      Promise.race([
        new Promise<void>((resolve) => this.once('idle', () => resolve())),
        this.removed,
      ])
    );
  }

  remove() {
    super.remove();
    this.markRemoved();
  }
}

// `MapLibreGL`'s `@mapLib` argument takes a loosely typed constructor.
export default SettledMap as unknown as new (...args: unknown[]) => MaplibreMap;
