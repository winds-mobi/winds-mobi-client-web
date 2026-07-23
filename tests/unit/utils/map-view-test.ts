import { module, test } from 'qunit';
import { cached } from '@glimmer/tracking';
import type { Map as MaplibreMap } from 'ember-maplibre-gl';
import type RouterService from '@ember/routing/router-service';
import {
  DEFAULT_MAP_LAT,
  DEFAULT_MAP_LNG,
  DEFAULT_MAP_ZOOM,
  boundsFromMap,
  mapBoundsEqual,
  mapViewFromMap,
  mapViewsEqual,
  parseMapView,
  roundBoundsForRequest,
  stableMapView,
  TrackedMapView,
} from 'winds-mobi-client-web/utils/map-view';

// `RouterService['currentRoute']['queryParams']` is a read-only real Ember
// type, so this keeps the mutable state behind a plain, loosely-typed object
// and only exposes the strictly-typed cast for reading -- `setQueryParams`
// mutates the same object the cast points at, simulating a route transition
// without ever needing to write through `RouterService`'s own types.
function fakeRouter(queryParams: Record<string, unknown>) {
  const state = { currentRoute: { queryParams } };

  return {
    router: state as unknown as RouterService,
    setQueryParams: (next: Record<string, unknown>) => {
      state.currentRoute = { queryParams: next };
    },
  };
}

module('Unit | Utility | map-view', function () {
  test('it parses defaults and numeric query params', function (assert) {
    assert.deepEqual(parseMapView(), {
      longitude: DEFAULT_MAP_LNG,
      latitude: DEFAULT_MAP_LAT,
      zoom: DEFAULT_MAP_ZOOM,
    });

    assert.deepEqual(
      parseMapView({
        longitude: '8.1234567',
        latitude: '46.7654321',
        zoom: '9.876',
      }),
      {
        longitude: 8.1234567,
        latitude: 46.7654321,
        zoom: 9.876,
      }
    );
  });

  test('it compares map views field by field', function (assert) {
    assert.true(
      mapViewsEqual(
        { longitude: 8.12345, latitude: 46.76543, zoom: 9.88 },
        { longitude: 8.12345, latitude: 46.76543, zoom: 9.88 }
      )
    );

    assert.false(
      mapViewsEqual(
        { longitude: 8.12345, latitude: 46.76543, zoom: 9.88 },
        { longitude: 8.12346, latitude: 46.76543, zoom: 9.88 }
      )
    );
  });

  test('it reads the current view from a map instance', function (assert) {
    const map = {
      getCenter() {
        return {
          lat: 46.7654321,
          lng: 8.1234567,
        };
      },
      getZoom() {
        return 9.876;
      },
    } as unknown as MaplibreMap;

    assert.deepEqual(mapViewFromMap(map), {
      longitude: 8.1234567,
      latitude: 46.7654321,
      zoom: 9.876,
    });
  });

  test('boundsFromMap reads the visible bounds from the map', function (assert) {
    const map = {
      getBounds() {
        return {
          getNorthEast() {
            return { lng: 8.5, lat: 47.2 };
          },
          getSouthWest() {
            return { lng: 7.6, lat: 46.4 };
          },
        };
      },
    } as unknown as MaplibreMap;

    assert.deepEqual(boundsFromMap(map), {
      northEast: [8.5, 47.2],
      southWest: [7.6, 46.4],
    });
  });

  test('roundBoundsForRequest snaps bounds to the ~0.01° refetch grid', function (assert) {
    const rounded = roundBoundsForRequest({
      northEast: [8.5123, 47.2087],
      southWest: [7.6041, 46.3962],
    });

    const closeTo = (actual: number, expected: number) =>
      Math.abs(actual - expected) < 1e-9;

    assert.true(closeTo(rounded.northEast[0], 8.51), 'NE longitude snapped');
    assert.true(closeTo(rounded.northEast[1], 47.21), 'NE latitude snapped');
    assert.true(closeTo(rounded.southWest[0], 7.6), 'SW longitude snapped');
    assert.true(closeTo(rounded.southWest[1], 46.4), 'SW latitude snapped');
  });

  test('roundBoundsForRequest collapses sub-threshold movements', function (assert) {
    const a = roundBoundsForRequest({
      northEast: [8.512, 47.208],
      southWest: [7.604, 46.396],
    });
    const b = roundBoundsForRequest({
      northEast: [8.5139, 47.2089],
      southWest: [7.6019, 46.3971],
    });

    assert.true(
      mapBoundsEqual(a, b),
      'tiny pans round to the same request bounds, so they do not refetch'
    );
  });

  // issue #131: `router.currentRoute` (what `currentMapView` reads) gets a
  // brand new identity on every transition, even one that leaves the map's
  // own query params untouched (e.g. selecting a different station). A
  // `@cached` getter downstream that depends on the *value* of the routed
  // view needs `stableMapView` to keep returning the same reference across
  // those transitions, otherwise it recomputes -- and the declarative
  // `<map.call @func="flyTo">` it feeds re-fires -- on every station switch,
  // not just ones that actually change the routed view.
  test('stableMapView keeps the previous reference when the new view is value-equal', function (assert) {
    const previous = { longitude: 8.12345, latitude: 46.76543, zoom: 9.88 };
    const next = { longitude: 8.12345, latitude: 46.76543, zoom: 9.88 };

    assert.strictEqual(
      stableMapView(previous, next),
      previous,
      'a value-equal but referentially distinct view resolves to the same reference'
    );
  });

  test('stableMapView adopts the new view when it actually differs', function (assert) {
    const previous = { longitude: 8.12345, latitude: 46.76543, zoom: 9.88 };
    const next = { longitude: 8.5, latitude: 46.76543, zoom: 9.88 };

    assert.strictEqual(
      stableMapView(previous, next),
      next,
      'a genuinely different view is adopted'
    );
  });

  test('stableMapView adopts the new view when there is no previous one', function (assert) {
    const next = { longitude: 8.12345, latitude: 46.76543, zoom: 9.88 };

    assert.strictEqual(stableMapView(undefined, next), next);
  });

  // issue #131: the actual bug wasn't in `stableMapView` (it always returned
  // the right reference) -- it was that the map component's first fix attempt
  // unconditionally assigned `stableMapView`'s result back to a `@tracked`
  // property on every route change. Ember's `@tracked` has no built-in
  // bail-out for a reference-equal reassignment -- re-setting a tracked
  // property to its own value is actually a documented technique for
  // *forcing* a recompute, the opposite of what's needed here -- so a
  // downstream `@cached` consumer (the map's `flyToOptions`) kept recomputing
  // on every station switch, silently undoing the fix. This exercises
  // `TrackedMapView` (the real class the map component uses) end-to-end
  // against a `@cached` consumer, using its own recompute count as proof,
  // without needing a component, rendering, or MapLibre/WebGL at all.
  test('TrackedMapView keeps a downstream @cached consumer from recomputing across a transition that leaves the view unchanged', function (assert) {
    class Consumer {
      trackedMapView: TrackedMapView;
      recomputeCount = 0;

      constructor(router: RouterService) {
        this.trackedMapView = new TrackedMapView(router);
      }

      @cached
      get flyToOptions() {
        this.recomputeCount++;
        const view = this.trackedMapView.current;
        return { center: [view.longitude, view.latitude], zoom: view.zoom };
      }
    }

    const { router, setQueryParams } = fakeRouter({
      longitude: 8.12345,
      latitude: 46.76543,
      zoom: 9.88,
    });
    const consumer = new Consumer(router);

    void consumer.flyToOptions;
    assert.strictEqual(
      consumer.recomputeCount,
      1,
      'initial read computes once, live off the router since nothing has synced yet'
    );

    // The *first* sync establishes `lastView` from nothing, which is a
    // genuine change and is expected to dirty the one recompute below --
    // this isn't the case the fix guards, just the baseline before it.
    consumer.trackedMapView.sync();
    void consumer.flyToOptions;
    assert.strictEqual(
      consumer.recomputeCount,
      2,
      'the first sync legitimately establishes a value and recomputes once'
    );

    // Simulate a *second* transition that leaves the routed view unchanged
    // (e.g. selecting a different station, which deliberately omits query
    // params). `router.currentRoute` would be a brand new object in real
    // Ember, but `currentMapView`/`parseMapView` already construct a fresh
    // `MapView` object on every call regardless of that, so the fake
    // router's `queryParams` reference doesn't need to change to reproduce
    // it -- this is the actual case the fix guards.
    consumer.trackedMapView.sync();
    void consumer.flyToOptions;
    assert.strictEqual(
      consumer.recomputeCount,
      2,
      'a subsequent transition that does not change the routed view does not trigger a downstream recompute'
    );

    // Now a transition that actually changes the routed view.
    setQueryParams({ longitude: 8.5, latitude: 46.76543, zoom: 9.88 });
    consumer.trackedMapView.sync();
    void consumer.flyToOptions;
    assert.strictEqual(
      consumer.recomputeCount,
      3,
      'a transition that changes the routed view does trigger a downstream recompute'
    );
  });
});
