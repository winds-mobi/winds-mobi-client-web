import { module, test } from 'qunit';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import {
  apiError,
  setupStubbedApi,
  stationsApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import {
  stationFixture,
  OVERLAPPING_STATIONS,
} from 'winds-mobi-client-web/tests/helpers/station-fixture';
import { byIdsQuery, findRecord } from 'winds-mobi-client-web/builders/station';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import type { History, Station } from 'winds-mobi-client-web/services/store';

function plainStation(station: Station) {
  return {
    id: station.id,
    altitude: station.altitude,
    latitude: station.latitude,
    longitude: station.longitude,
    isPeak: station.isPeak,
    providerName: station.providerName,
    providerUrl: station.providerUrl,
    name: station.name,
    last: { ...station.last },
  };
}

function plainHistory(reading: History) {
  const {
    id,
    timestamp,
    direction,
    speed,
    gusts,
    temperature,
    humidity,
    rain,
  } = reading;

  return {
    id,
    timestamp,
    direction,
    speed,
    gusts,
    temperature,
    humidity,
    rain,
  };
}

const HISTORY: History[] = [
  {
    id: 'holfuy-1804:1709999400',
    timestamp: 1_709_999_400_000,
    direction: 230,
    speed: 10,
    gusts: 15,
    temperature: 6,
    humidity: 60,
    rain: 0,
    [Type]: 'history',
  },
  {
    id: 'holfuy-1804:1710000000',
    timestamp: 1_710_000_000_000,
    direction: 240,
    speed: 12,
    gusts: 18,
    temperature: 7,
    humidity: 65,
    rain: 0.2,
    [Type]: 'history',
  },
];

// The stub serves fixtures as raw API payloads, and the real handlers turn
// them back into records. If either side drifts, every test built on
// `stationsApi` would silently test a different station than it builds.
module('Integration | Helper | stub-api', function (hooks) {
  setupTest(hooks);
  const api = setupStubbedApi(hooks);

  test('a station fixture comes back out of the real store unchanged', async function (assert) {
    const fixture = stationFixture();
    api.respond = stationsApi({ stations: [fixture] });
    const store = this.owner.lookup('service:store');

    const { content } = await store.request(
      findRecord<Station>('station', fixture.id)
    );

    assert.deepEqual(plainStation(content.data), plainStation(fixture));
  });

  test('a list narrows to the requested ids, in fixture order', async function (assert) {
    api.respond = stationsApi({ stations: OVERLAPPING_STATIONS });
    const store = this.owner.lookup('service:store');

    const { content } = await store.request(
      byIdsQuery<Station>('station', ['slf-PMA2'])
    );

    assert.deepEqual(content.data.map(plainStation), [
      plainStation(OVERLAPPING_STATIONS[1]!),
    ]);
  });

  test('history comes back oldest first, as built', async function (assert) {
    api.respond = stationsApi({ history: HISTORY });
    const store = this.owner.lookup('service:store');

    const { content } = await store.request(
      historyQuery<History>('history', 'holfuy-1804')
    );

    assert.deepEqual(content.data.map(plainHistory), HISTORY.map(plainHistory));
  });

  test('an unknown station and apiError() both fail the request', async function (assert) {
    api.respond = stationsApi({ stations: [] });
    const store = this.owner.lookup('service:store');

    await assert.rejects(store.request(findRecord<Station>('station', 'nope')));

    api.respond = () => apiError(503);

    await assert.rejects(
      store.request(findRecord<Station>('station', 'holfuy-1804'))
    );
  });
});
