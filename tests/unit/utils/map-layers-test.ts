import { module, test } from 'qunit';
import { Type } from '@warp-drive/core-types/symbols';
import type { Station } from 'winds-mobi-client-web/services/store';
import {
  buildGpsLayer,
  buildStationArrowIconUrl,
  buildStationLayer,
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

module('Unit | Utility | map-layers', function () {
  test('it builds station layers with rotated arrow icons', function (assert) {
    const selected: string[] = [];
    const layer = buildStationLayer([station], undefined, (stationId) => {
      selected.push(stationId);
    }) as unknown as { props: Record<string, (...args: unknown[]) => unknown> };

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
    assert.true(
      buildStationArrowIconUrl(station.last.speed).includes(
        'data:image/svg+xml;charset=UTF-8,'
      )
    );
  });

  test('it adds a white outline to the selected station icon', function (assert) {
    const layer = buildStationLayer(
      [station],
      'station-1',
      () => undefined
    ) as unknown as { props: Record<string, (...args: unknown[]) => unknown> };

    const icon = layer.props.getIcon(station) as { url: string };
    const selectedIconUrl = buildStationArrowIconUrl(station.last.speed, true);
    const defaultIconUrl = buildStationArrowIconUrl(station.last.speed, false);

    assert.strictEqual(icon.url, selectedIconUrl);
    assert.notStrictEqual(selectedIconUrl, defaultIconUrl);
    assert.true(
      decodeURIComponent(selectedIconUrl).includes('stroke="#ffffff"')
    );
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
