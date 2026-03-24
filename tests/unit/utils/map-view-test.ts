import { module, test } from 'qunit';
import type { Map as MaplibreMap } from 'ember-maplibre-gl';
import {
  DEFAULT_MAP_LAT,
  DEFAULT_MAP_LNG,
  DEFAULT_MAP_ZOOM,
  isMapRoute,
  MAP_REQUEST_COORDINATE_THRESHOLD,
  MAP_REQUEST_ZOOM_THRESHOLD,
  mapBoundsFromMap,
  mapViewChangeRequiresStationRefetch,
  mapViewFromMap,
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

  test('it reads and normalizes the current view and bounds from a map instance', function (assert) {
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
      getBounds() {
        return {
          getNorthEast() {
            return {
              lat: 46.8888888,
              lng: 8.9999999,
            };
          },
          getSouthWest() {
            return {
              lat: 46.1111111,
              lng: 8.0000001,
            };
          },
        };
      },
    } as unknown as MaplibreMap;

    assert.deepEqual(mapViewFromMap(map), {
      longitude: 8.12346,
      latitude: 46.76543,
      zoom: 9.88,
    });

    assert.deepEqual(mapBoundsFromMap(map), {
      northEast: [9, 46.88889],
      southWest: [8, 46.11111],
    });
  });

  test('it applies the station-request threshold to map view changes', function (assert) {
    assert.false(
      mapViewChangeRequiresStationRefetch(
        { longitude: 8.12345, latitude: 46.54321, zoom: 9.5 },
        {
          longitude: 8.12345 + MAP_REQUEST_COORDINATE_THRESHOLD / 2,
          latitude: 46.54321,
          zoom: 9.5,
        }
      )
    );

    assert.true(
      mapViewChangeRequiresStationRefetch(
        { longitude: 8.12345, latitude: 46.54321, zoom: 9.5 },
        {
          longitude: 8.12345 + MAP_REQUEST_COORDINATE_THRESHOLD + 0.00001,
          latitude: 46.54321,
          zoom: 9.5,
        }
      )
    );

    assert.true(
      mapViewChangeRequiresStationRefetch(
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
