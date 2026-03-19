import { module, test } from 'qunit';
import {
  DEFAULT_MAP_LAT,
  DEFAULT_MAP_LNG,
  DEFAULT_MAP_ZOOM,
  isMapRoute,
  mapViewsEqual,
  parseMapView,
  serializeMapView,
} from 'winds-mobi-client-web/utils/map-view';

module('Unit | Utility | map-view', function () {
  test('it parses defaults and normalizes query params', function (assert) {
    assert.deepEqual(parseMapView(), {
      longitude: DEFAULT_MAP_LNG,
      latitude: DEFAULT_MAP_LAT,
      zoom: DEFAULT_MAP_ZOOM,
    });

    assert.deepEqual(
      parseMapView({
        mapLng: '8.1234567',
        mapLat: '46.7654321',
        mapZoom: '9.876',
      }),
      {
        longitude: 8.12346,
        latitude: 46.76543,
        zoom: 9.88,
      }
    );
  });

  test('it serializes and compares normalized map views', function (assert) {
    assert.deepEqual(
      serializeMapView({
        longitude: 8.1234567,
        latitude: 46.7654321,
        zoom: 9.876,
      }),
      {
        mapLng: 8.12346,
        mapLat: 46.76543,
        mapZoom: 9.88,
      }
    );

    assert.true(
      mapViewsEqual(
        { longitude: 8.123456, latitude: 46.765432, zoom: 9.876 },
        { longitude: 8.12346, latitude: 46.76543, zoom: 9.88 }
      )
    );

    assert.true(isMapRoute('map'));
    assert.true(isMapRoute('map.station.summary'));
    assert.false(isMapRoute('index'));
  });
});
