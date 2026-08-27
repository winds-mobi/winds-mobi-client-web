import Service from '@ember/service';
import { module, test } from 'qunit';
import { findAll, settled, visit, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import type { Station } from 'winds-mobi-client-web/services/store';

type FakeStoreRequest = {
  url?: string;
};

const STATION_FIXTURES: Station[] = [
  {
    id: 'holfuy-1804',
    altitude: 1804,
    latitude: 46.521,
    longitude: 6.632,
    isPeak: false,
    providerName: 'Holfuy',
    providerUrl: 'https://example.com/stations/holfuy-1804',
    name: 'Holfuy 1804',
    last: {
      timestamp: 1_710_000_000_000,
      direction: 240,
      speed: 12,
      gusts: 18,
      temperature: 7,
      humidity: 65,
      pressure: 1012,
      rain: 0,
    },
    [Type]: 'station',
  },
  {
    id: 'holfuy-2222',
    altitude: 2222,
    latitude: 46.53,
    longitude: 6.64,
    isPeak: true,
    providerName: 'Holfuy',
    providerUrl: 'https://example.com/stations/holfuy-2222',
    name: 'Holfuy 2222',
    last: {
      timestamp: 1_710_000_000_000,
      direction: 220,
      speed: 20,
      gusts: 28,
      temperature: 3,
      humidity: 58,
      pressure: 1008,
      rain: 0,
    },
    [Type]: 'station',
  },
];

class FakeStoreService extends Service {
  calls: string[] = [];

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    this.calls.push(url);

    return Promise.resolve({
      content: {
        data: STATION_FIXTURES,
      },
    });
  }
}

function countStationRequests(calls: string[]) {
  return calls.filter((url) => url.includes('/stations/')).length;
}

const ALARMS_CARD_SELECTOR = '[data-test-nearby-station-card]';

module('Acceptance | alarms route', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;
    this.owner.lookup('service:settings').alarmsFeatureEnabled = true;
  });

  test('with no alarms it shows the empty state and skips the station request', async function (assert) {
    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;

    await visit('/alarms');
    await waitFor('[data-test-alarms-empty]');

    assert.dom('[data-test-alarms-empty]').exists();
    assert.dom(ALARMS_CARD_SELECTOR).doesNotExist();
    assert.strictEqual(countStationRequests(store.calls), 0);
  });

  test('the navbar links to the alarms view', async function (assert) {
    await visit('/alarms');

    assert.dom('[data-test-navbar-link="alarms"]').exists();
  });

  function saveAlarm(owner: unknown, stationId: string) {
    (
      (owner as { lookup(name: string): unknown }).lookup('service:alarms') as {
        save(config: {
          stationId: string;
          directionBands: (number | null)[];
          metric: 'wind' | 'gusts';
          createdAt: number;
        }): void;
      }
    ).save({
      stationId,
      directionBands: [null, null, null, null, null, 6, null, null],
      metric: 'gusts',
      createdAt: 0,
    });
  }

  test('it renders the alarmed stations as cards, same as favourites', async function (assert) {
    // Added in reverse of STATION_FIXTURES to pin the ordering behaviour.
    saveAlarm(this.owner, 'holfuy-2222');
    saveAlarm(this.owner, 'holfuy-1804');

    await visit('/alarms');

    assert.dom('[data-test-alarms-empty]').doesNotExist();

    const titles = findAll(
      `${ALARMS_CARD_SELECTOR} [data-test-station-title]`
    ).map((element) => element.textContent?.trim());

    assert.deepEqual(
      titles,
      ['Holfuy 2222', 'Holfuy 1804'],
      'cards follow the order alarms were added, not the response order'
    );
    assert
      .dom(`${ALARMS_CARD_SELECTOR} [data-test-station-alarm]`)
      .exists(
        { count: 2 },
        'the same bell control as the station panel is present on every card'
      );
  });

  test('it shows compact cards when the compact alarms list preference is on', async function (assert) {
    saveAlarm(this.owner, 'holfuy-1804');
    saveAlarm(this.owner, 'holfuy-2222');

    await visit('/alarms');

    assert.dom('[data-test-alarms-stations-compact]').doesNotExist();
    assert
      .dom('[data-test-nearby-station-card-compact]')
      .doesNotExist('compact cards are not rendered in card view');

    this.owner.lookup('service:settings').alarmsCompactList = true;
    await settled();

    assert
      .dom(ALARMS_CARD_SELECTOR)
      .doesNotExist('full cards are not rendered in compact view');
    assert
      .dom('[data-test-nearby-station-card-compact]')
      .exists({ count: STATION_FIXTURES.length });
  });
});
