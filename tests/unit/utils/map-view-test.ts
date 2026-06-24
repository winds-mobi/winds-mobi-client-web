import { module, test } from 'qunit';
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
});
