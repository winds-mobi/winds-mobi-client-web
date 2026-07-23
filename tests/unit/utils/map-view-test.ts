import { module, test } from 'qunit';
import { cached, tracked } from '@glimmer/tracking';
import type { Map as MaplibreMap } from 'ember-maplibre-gl';
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
} from 'winds-mobi-client-web/utils/map-view';

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

  // The bug this guards against isn't in `stableMapView` itself (it always
  // returned the right reference) -- it's that a *caller* which unconditionally
  // assigns `stableMapView`'s result back to a `@tracked` property still
  // invalidates that property's consumers even when the assigned value is
  // reference-equal. Ember's `@tracked` has no built-in bail-out for a
  // reference-equal reassignment -- re-setting a tracked property to its own
  // value is actually a documented technique for *forcing* a recompute, the
  // opposite of what's needed here. The first attempt at fixing issue #131
  // did exactly this (always wrote `this.lastMapView = stableMapView(...)`),
  // which silently kept `flyToOptions` recomputing on every station switch,
  // same as before the fix. The real fix skips the assignment entirely when
  // `stableMapView` returns the same reference -- this test exercises that
  // exact caller pattern (not just the pure function) via a plain tracked
  // class, using `@cached`'s own recompute-counting to prove it, without
  // needing a component, rendering, or MapLibre/WebGL at all.
  test('a caller that skips the assignment when stableMapView returns the same reference avoids downstream recomputation', function (assert) {
    class Probe {
      @tracked mapView = { longitude: 8.12345, latitude: 46.76543, zoom: 9.88 };
      recomputeCount = 0;

      @cached
      get flyToOptions() {
        this.recomputeCount++;
        return { center: [this.mapView.longitude, this.mapView.latitude] };
      }

      updateGuarded(next: typeof this.mapView) {
        const stable = stableMapView(this.mapView, next);

        if (stable !== this.mapView) {
          this.mapView = stable;
        }
      }

      updateUnguarded(next: typeof this.mapView) {
        this.mapView = stableMapView(this.mapView, next);
      }
    }

    const guarded = new Probe();
    void guarded.flyToOptions;
    assert.strictEqual(guarded.recomputeCount, 1, 'initial read computes once');

    guarded.updateGuarded({
      longitude: 8.12345,
      latitude: 46.76543,
      zoom: 9.88,
    });
    void guarded.flyToOptions;
    assert.strictEqual(
      guarded.recomputeCount,
      1,
      'guarded update with a value-equal view does not trigger a recompute'
    );

    const unguarded = new Probe();
    void unguarded.flyToOptions;
    assert.strictEqual(unguarded.recomputeCount, 1);

    unguarded.updateUnguarded({
      longitude: 8.12345,
      latitude: 46.76543,
      zoom: 9.88,
    });
    void unguarded.flyToOptions;
    assert.strictEqual(
      unguarded.recomputeCount,
      2,
      'unconditionally re-assigning even a value-equal reference still dirties the tracked property and forces a recompute -- this is the exact regression the guard in handleRouteChange prevents'
    );
  });
});
