import { module, test } from 'qunit';
import type { Map as MaplibreMap } from 'ember-maplibre-gl';
import {
  DEFAULT_MAP_LAT,
  DEFAULT_MAP_LNG,
  DEFAULT_MAP_ZOOM,
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
});
