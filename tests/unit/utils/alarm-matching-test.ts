import { module, test } from 'qunit';
import { Type } from '@warp-drive/core/types/symbols';
import { stationTriggersAlarm } from 'winds-mobi-client-web/utils/alarm-matching';
import type { AlarmConfig } from 'winds-mobi-client-web/services/alarms';
import type { Station } from 'winds-mobi-client-web/services/store';

function station(overrides: Partial<Station['last']> = {}): Station {
  return {
    id: 'holfuy-1804',
    altitude: 1804,
    latitude: 46.521,
    longitude: 6.632,
    isPeak: false,
    name: 'Holfuy 1804',
    last: {
      timestamp: 1_710_000_000_000,
      direction: 240, // SW, direction index 5
      speed: 10,
      gusts: 38,
      temperature: 7,
      humidity: 65,
      pressure: 1012,
      rain: 0,
      ...overrides,
    },
    [Type]: 'station',
  };
}

function config(overrides: Partial<AlarmConfig> = {}): AlarmConfig {
  return {
    stationId: 'holfuy-1804',
    directionBands: new Array<number | null>(8).fill(null),
    metric: 'gusts',
    createdAt: 0,
    ...overrides,
  };
}

module('Unit | Utility | alarm-matching', function () {
  test('does not trigger when every direction is unarmed', function (assert) {
    assert.false(stationTriggersAlarm(station(), config()));
  });

  test('triggers once the reading is at or above the armed band (band-or-higher)', function (assert) {
    const directionBands = new Array<number | null>(8).fill(null);

    // gusts=38 falls in wind-40 (band index 7); arming a lower band (wind-35,
    // index 6) should still trigger.
    directionBands[5] = 6;

    assert.true(stationTriggersAlarm(station(), config({ directionBands })));
  });

  test('triggers exactly at the armed band', function (assert) {
    const directionBands = new Array<number | null>(8).fill(null);

    directionBands[5] = 7;

    assert.true(stationTriggersAlarm(station(), config({ directionBands })));
  });

  test('does not trigger below the armed band', function (assert) {
    const directionBands = new Array<number | null>(8).fill(null);

    directionBands[5] = 8; // wind-45, above the reading's band (7)

    assert.false(stationTriggersAlarm(station(), config({ directionBands })));
  });

  test('an armed direction that does not match the reading does not trigger', function (assert) {
    const directionBands = new Array<number | null>(8).fill(null);

    directionBands[0] = 0; // N armed at the lowest band, reading is from SW

    assert.false(stationTriggersAlarm(station(), config({ directionBands })));
  });

  test('metric picks gusts or average wind speed', function (assert) {
    const directionBands = new Array<number | null>(8).fill(null);

    directionBands[5] = 7; // requires band index >= 7

    assert.true(
      stationTriggersAlarm(
        station(),
        config({ directionBands, metric: 'gusts' })
      ),
      'gusts (38 -> band 7) trigger'
    );
    assert.false(
      stationTriggersAlarm(
        station(),
        config({ directionBands, metric: 'wind' })
      ),
      'average wind (10 -> band 2) does not'
    );
  });
});
