import { module, test } from 'qunit';
import { Type } from '@warp-drive/core/types/symbols';
import { stationFaviconDataUri } from 'winds-mobi-client-web/utils/station-favicon';
import {
  ARROW_DIRECTION_OFFSET,
  stationArrowGeometry,
} from 'winds-mobi-client-web/utils/station-arrow';
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

// How many <path> elements the SVG draws (one per arrow body, plus the hub disc).
function pathCount(svg: string): number {
  return svg.match(/<path/g)?.length ?? 0;
}

module('Unit | Utility | station-favicon', function () {
  test('it builds an svg data uri rotated to the wind direction', function (assert) {
    const dataUri = stationFaviconDataUri(BASE_STATION);

    assert.true(
      dataUri.startsWith('data:image/svg+xml,'),
      'it produces an svg data uri'
    );

    const svg = decode(dataUri);
    const geometry = stationArrowGeometry(false);

    assert.true(svg.includes('<svg'), 'it contains an svg root');
    assert.true(
      svg.includes(
        `rotate(${240 + ARROW_DIRECTION_OFFSET} ${geometry.rotationCentre})`
      ),
      'it rotates the arrow to the wind direction around the regular centre'
    );
    assert.true(
      svg.includes('stroke="rgb(0, 0, 0)"'),
      'the arrow carries a plain black outline'
    );
  });

  test('it lights the hub when gusts fall in a higher wind band', function (assert) {
    // speed 12 (wind-15 band) vs gusts 18 (wind-20 band) → a gust-coloured disc
    // is drawn behind the arrow, so the svg holds the arrow body plus the hub.
    const svg = decode(stationFaviconDataUri(BASE_STATION));

    assert.true(
      svg.includes(stationArrowGeometry(false).gustsPath),
      'it draws the gusts hub disc'
    );
    assert.strictEqual(
      pathCount(svg),
      2,
      'it draws the arrow body and the hub disc'
    );
  });

  test('it omits the hub when gusts share the average wind band', function (assert) {
    const svg = decode(
      stationFaviconDataUri({
        ...BASE_STATION,
        last: { ...BASE_STATION.last, speed: 12, gusts: 13 },
      })
    );

    assert.strictEqual(
      pathCount(svg),
      1,
      'a same-band gust adds no hub disc, leaving just the arrow body'
    );
  });

  test('it uses the peak geometry for peak stations', function (assert) {
    const svg = decode(
      stationFaviconDataUri({ ...BASE_STATION, isPeak: true })
    );
    const peak = stationArrowGeometry(true);

    assert.true(
      svg.includes(
        `rotate(${240 + ARROW_DIRECTION_OFFSET} ${peak.rotationCentre})`
      ),
      'it rotates around the peak rotation centre'
    );
    assert.true(svg.includes(peak.viewBox), 'it uses the peak viewBox');
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
