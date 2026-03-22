import { module, test } from 'qunit';
import {
  DEFAULT_MAP_LAT,
  DEFAULT_MAP_LNG,
  DEFAULT_MAP_ZOOM,
  isMapRoute,
  MAP_REQUEST_COORDINATE_THRESHOLD,
  MAP_REQUEST_ZOOM_THRESHOLD,
  mapViewExceedsRequestThreshold,
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
    assert.true(isMapRoute('map.station'));
    assert.false(isMapRoute('index'));
  });

  test('it applies the station-request threshold to map view changes', function (assert) {
    assert.false(
      mapViewExceedsRequestThreshold(
        { longitude: 8.12345, latitude: 46.54321, zoom: 9.5 },
        {
          longitude: 8.12345 + MAP_REQUEST_COORDINATE_THRESHOLD / 2,
          latitude: 46.54321,
          zoom: 9.5,
        }
      )
    );

    assert.true(
      mapViewExceedsRequestThreshold(
        { longitude: 8.12345, latitude: 46.54321, zoom: 9.5 },
        {
          longitude: 8.12345 + MAP_REQUEST_COORDINATE_THRESHOLD + 0.00001,
          latitude: 46.54321,
          zoom: 9.5,
        }
      )
    );

    assert.true(
      mapViewExceedsRequestThreshold(
        { longitude: 8.12345, latitude: 46.54321, zoom: 9.5 },
        {
          longitude: 8.12345,
          latitude: 46.54321,
          zoom: 9.5 + MAP_REQUEST_ZOOM_THRESHOLD,
        }
      )
    );
  });
});
