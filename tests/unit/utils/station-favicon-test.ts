import { module, test } from 'qunit';
import { Type } from '@warp-drive/core/types/symbols';
import { stationFaviconDataUri } from 'winds-mobi-client-web/utils/station-favicon';
import type { Station } from 'winds-mobi-client-web/services/store';

const BASE_STATION: Station = {
  id: 'holfuy-1804',
  altitude: 1804,
  latitude: 46.67719,
  longitude: 7.86323,
  isPeak: false,
  providerName: 'Holfuy',
  providerUrl: 'https://example.com/stations/holfuy-1804',
  name: 'Holfuy 1804',
  last: {
    timestamp: Date.now(),
    direction: 240,
    speed: 12,
    gusts: 18,
    temperature: 7,
    humidity: 65,
    pressure: 1012,
    rain: 0,
  },
  [Type]: 'station',
};

function decode(dataUri: string): string {
  const [, payload] = dataUri.split(',');
  return decodeURIComponent(payload ?? '');
}

module('Unit | Utility | station-favicon', function () {
  test('it builds an svg data uri rotated to the wind direction', function (assert) {
    const dataUri = stationFaviconDataUri(BASE_STATION);

    assert.true(
      dataUri.startsWith('data:image/svg+xml,'),
      'it produces an svg data uri'
    );

    const svg = decode(dataUri);

    assert.true(svg.includes('<svg'), 'it contains an svg root');
    assert.true(
      svg.includes('rotate(240 -80 100)'),
      'it rotates the arrow to the wind direction around the regular centre'
    );
    assert.strictEqual(
      svg.match(/<path/g)?.length,
      1,
      'it draws the arrow as a single path'
    );
    assert.true(
      svg.includes('stroke="rgb(0, 0, 0)"'),
      'the arrow carries a plain black outline'
    );
  });

  test('it lights the hub when gusts fall in a higher wind band', function (assert) {
    // speed 12 (wind-15 band) vs gusts 18 (wind-20 band) → hub recoloured.
    const svg = decode(stationFaviconDataUri(BASE_STATION));

    assert.true(svg.includes('<circle'), 'it draws a gusts hub disc');
  });

  test('it omits the hub when gusts share the average wind band', function (assert) {
    const svg = decode(
      stationFaviconDataUri({
        ...BASE_STATION,
        last: { ...BASE_STATION.last, speed: 12, gusts: 13 },
      })
    );

    assert.false(svg.includes('<circle'), 'a same-band gust adds no hub disc');
  });

  test('it uses the peak geometry for peak stations', function (assert) {
    const svg = decode(
      stationFaviconDataUri({ ...BASE_STATION, isPeak: true })
    );

    assert.true(
      svg.includes('rotate(240 0 20)'),
      'it rotates around the peak rotation centre'
    );
    assert.true(
      svg.includes('-220 -200 440 440'),
      'it uses the peak favicon viewBox'
    );
  });

  test('it resolves wind-band colours to concrete values', function (assert) {
    const svg = decode(stationFaviconDataUri(BASE_STATION));

    assert.false(
      svg.includes('var(--color-wind'),
      'it does not leak unresolved CSS custom properties into the favicon'
    );
  });

  test('it greys out stale readings', function (assert) {
    const svg = decode(
      stationFaviconDataUri({
        ...BASE_STATION,
        last: { ...BASE_STATION.last, timestamp: 0 },
      })
    );

    assert.true(
      svg.includes('rgb(148, 163, 184)'),
      'a day-old reading is drawn in the stale colour'
    );
  });
});
