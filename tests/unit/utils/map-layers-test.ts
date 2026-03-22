import { module, test } from 'qunit';
import { Type } from '@warp-drive/core/types/symbols';
import type { Station } from 'winds-mobi-client-web/services/store';
import {
  getStationArrowIconUrlCacheSizeForTest,
  buildGpsLayer,
  buildStationArrowIconUrl,
  buildStationLayer,
  resetStationArrowIconUrlCacheForTest,
} from 'winds-mobi-client-web/utils/map-layers';

const station = {
  id: 'station-1',
  altitude: 1234,
  latitude: 46.77,
  longitude: 7.62,
  isPeak: false,
  providerName: 'Provider',
  providerUrl: 'https://example.com',
  name: 'Station 1',
  last: {
    timestamp: Date.now(),
    direction: 270,
    speed: 14,
    gusts: 22,
    temperature: 10,
    humidity: 65,
    pressure: 1014,
    rain: 0,
  },
  [Type]: 'station',
} as Station;

type StationLayer = {
  props: {
    getPosition: (station: Station) => [number, number];
    getAngle: (station: Station) => number;
    getIcon: (station: Station) => {
      url: string;
      width: number;
      height: number;
      anchorX: number;
      anchorY: number;
    };
    onClick: (info: { object?: Station }) => void;
    updateTriggers: {
      getIcon: string;
    };
  };
};

module('Unit | Utility | map-layers', function (hooks) {
  hooks.beforeEach(function () {
    resetStationArrowIconUrlCacheForTest();
  });

  test('it builds station layers with rotated arrow icons', function (assert) {
    const selected: string[] = [];
    const layer = buildStationLayer([station], undefined, (stationId) => {
      selected.push(stationId);
    }) as unknown as StationLayer;

    assert.deepEqual(layer.props.getPosition(station), [7.62, 46.77]);
    assert.strictEqual(layer.props.getAngle(station), 270);

    const icon = layer.props.getIcon(station) as {
      url: string;
      width: number;
      height: number;
      anchorX: number;
      anchorY: number;
    };

    assert.true(icon.url.startsWith('data:image/svg+xml;charset=UTF-8,'));
    assert.strictEqual(icon.width, 42);
    assert.strictEqual(icon.height, 42);
    assert.strictEqual(icon.anchorX, 21);
    assert.strictEqual(icon.anchorY, 21);

    layer.props.onClick({ object: station });

    assert.deepEqual(selected, ['station-1']);
    assert.strictEqual(layer.props.updateTriggers.getIcon, '');
    assert.true(
      buildStationArrowIconUrl(
        station.last.speed,
        station.last.timestamp
      ).includes('data:image/svg+xml;charset=UTF-8,')
    );
  });

  test('it adds a black outline to the selected station icon', function (assert) {
    const layer = buildStationLayer(
      [station],
      'station-1',
      () => undefined
    ) as unknown as StationLayer;

    const icon = layer.props.getIcon(station);
    const selectedIconUrl = buildStationArrowIconUrl(
      station.last.speed,
      station.last.timestamp,
      true
    );
    const defaultIconUrl = buildStationArrowIconUrl(
      station.last.speed,
      station.last.timestamp,
      false
    );

    assert.strictEqual(icon.url, selectedIconUrl);
    assert.notStrictEqual(selectedIconUrl, defaultIconUrl);
    assert.strictEqual(layer.props.updateTriggers.getIcon, 'station-1');
    assert.true(
      decodeURIComponent(selectedIconUrl).includes('stroke="#000000"')
    );
  });

  test('it renders stale stations in grey regardless of wind speed', function (assert) {
    const staleTimestamp = Date.now() - 25 * 60 * 60 * 1000;
    const iconUrl = buildStationArrowIconUrl(40, staleTimestamp);

    assert.true(
      decodeURIComponent(iconUrl).includes('fill="rgb(148, 163, 184)"')
    );
  });

  test('it caches station arrow icon URLs by colour and selection state', function (assert) {
    const freshTimestamp = Date.now();
    const firstIconUrl = buildStationArrowIconUrl(14, freshTimestamp, false);
    const repeatedIconUrl = buildStationArrowIconUrl(14, freshTimestamp, false);
    const selectedIconUrl = buildStationArrowIconUrl(14, freshTimestamp, true);

    assert.strictEqual(firstIconUrl, repeatedIconUrl);
    assert.notStrictEqual(firstIconUrl, selectedIconUrl);
    assert.strictEqual(getStationArrowIconUrlCacheSizeForTest(), 2);
  });

  test('it builds a gps icon layer', function (assert) {
    const layer = buildGpsLayer([7.81, 46.91]) as unknown as {
      props: Record<string, (...args: unknown[]) => unknown>;
    };

    const position = layer.props.getPosition({ coordinates: [7.81, 46.91] });
    const icon = layer.props.getIcon({});

    assert.deepEqual(position, [7.81, 46.91]);
    assert.strictEqual(
      (icon as { url: string }).url,
      '/images/you-are-here.svg'
    );
    assert.strictEqual(layer.props.getSize({}), 16);
  });
});
