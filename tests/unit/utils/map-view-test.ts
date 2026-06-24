import { module, test } from 'qunit';
import type { Map as MaplibreMap } from 'ember-maplibre-gl';
import {
  DEFAULT_MAP_LAT,
  DEFAULT_MAP_LNG,
  DEFAULT_MAP_ZOOM,
  mapBoundsFromView,
  mapViewFromMap,
  mapViewsEqual,
  parseMapView,
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

  test('mapBoundsFromView centers the box on the view', function (assert) {
    const bounds = mapBoundsFromView(
      { longitude: 8, latitude: 47, zoom: 10 },
      1024,
      768
    );

    assert.strictEqual(
      bounds.northEast[0] - 8,
      8 - bounds.southWest[0],
      'east and west are equidistant from the centre longitude'
    );
    assert.true(bounds.northEast[1] > 47, 'north edge is above the centre');
    assert.true(bounds.southWest[1] < 47, 'south edge is below the centre');
  });

  test('mapBoundsFromView uses Web-Mercator longitude spans', function (assert) {
    // half-span = (width / 2) * 360 / (512 * 2 ** zoom)
    //           = 512 * 360 / (512 * 1024) = 360 / 1024 = 0.3515625
    const bounds = mapBoundsFromView(
      { longitude: 8, latitude: 47, zoom: 10 },
      1024,
      768
    );

    assert.strictEqual(bounds.northEast[0], 8.3515625, 'east edge');
    assert.strictEqual(bounds.southWest[0], 7.6484375, 'west edge');
  });

  test('mapBoundsFromView longitude span scales linearly with viewport width', function (assert) {
    const view = { longitude: 8, latitude: 47, zoom: 10 };
    const narrow = mapBoundsFromView(view, 1000, 800);
    const wide = mapBoundsFromView(view, 2000, 800);

    const narrowSpan = narrow.northEast[0] - narrow.southWest[0];
    const wideSpan = wide.northEast[0] - wide.southWest[0];

    assert.ok(
      Math.abs(wideSpan - 2 * narrowSpan) < 1e-9,
      'doubling the viewport width doubles the longitude span'
    );
  });

  test('mapBoundsFromView covers a wider box than the old fixed approximation on large maps', function (assert) {
    // Regression: the previous heuristic used a fixed half-width of
    // `360 / 2 ** zoom`, sized for a ~1024px-wide map, so wider maps
    // under-fetched their edges. A 2048px viewport must request a wider box.
    const zoom = 10;
    const fixedHalfSpan = 360 / 2 ** zoom;
    const wide = mapBoundsFromView(
      { longitude: 8, latitude: 47, zoom },
      2048,
      768
    );

    assert.ok(
      wide.northEast[0] - 8 > fixedHalfSpan,
      'a 2048px-wide viewport requests a wider box than the old ~1024px one'
    );
  });

  test('mapBoundsFromView latitude span grows with viewport height', function (assert) {
    const view = { longitude: 8, latitude: 47, zoom: 10 };
    const short = mapBoundsFromView(view, 1000, 500);
    const tall = mapBoundsFromView(view, 1000, 1000);

    const shortSpan = short.northEast[1] - short.southWest[1];
    const tallSpan = tall.northEast[1] - tall.southWest[1];

    assert.true(
      tallSpan > shortSpan,
      'a taller viewport requests a taller box'
    );
  });
});
