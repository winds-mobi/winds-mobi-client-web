import { waitForPromise } from '@ember/test-waiters';
import { Map as MaplibreMap, type MapOptions } from 'maplibre-gl';

// A MapLibre map that tells Ember's test waiters while it's busy: from
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

  constructor(options: MapOptions) {
    super(options);
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
