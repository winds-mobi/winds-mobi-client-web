import Service from '@ember/service';
import { module, test } from 'qunit';
import {
  click,
  currentURL,
  findAll,
  visit,
  waitFor,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { Type } from '@warp-drive/core/types/symbols';
import type { Station } from 'winds-mobi-client-web/services/store';

type FakeStoreRequest = {
  url?: string;
};

const STATION_FIXTURES: Station[] = [
  {
    id: 'meteoswiss-PMA',
    altitude: 2500,
    latitude: 46.577,
    longitude: 9.53,
    isPeak: true,
    providerName: 'MeteoSwiss',
    providerUrl: 'https://example.com/stations/meteoswiss-PMA',
    name: 'Piz Martegnas',
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
    id: 'slf-PMA2',
    altitude: 2450,
    latitude: 46.5768,
    longitude: 9.5292,
    isPeak: false,
    providerName: 'SLF',
    providerUrl: 'https://example.com/stations/slf-PMA2',
    name: 'Colms da Parsonz',
    last: {
      timestamp: 1_710_000_000_000,
      direction: 220,
      speed: 2,
      gusts: 4,
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

    // History is a list, a single station is one record, and the collection
    // query is a list: returning the wrong shape doesn't fail here, it throws
    // deep inside the station panel's charts instead.
    if (url.includes('/historic/')) {
      return Promise.resolve({ content: { data: [] }, request });
    }

    const singleStation = STATION_FIXTURES.find((station) =>
      url.includes(`/stations/${station.id}/?`)
    );

    if (singleStation) {
      return Promise.resolve({ content: { data: singleStation }, request });
    }

    // A by-ids query returns just those stations, as the real API does.
    const ids = new URL(url, 'https://winds.mobi').searchParams.getAll('ids');

    return Promise.resolve({
      content: {
        data:
          ids.length > 0
            ? STATION_FIXTURES.filter((station) => ids.includes(station.id))
            : STATION_FIXTURES,
      },
      // WarpDrive's `<Request>` `state.refresh()` replays the request it
      // finds echoed back on a resolved response -- without it, a refresh
      // resolves against an empty/unknown request instead of this same URL.
      request,
    });
  }
}

function countStationRequests(calls: string[]) {
  return calls.filter((url) => url.includes('/stations/')).length;
}

const HIDDEN_CARD_SELECTOR = '[data-test-nearby-station-card]';

module('Acceptance | hidden stations', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;
    this.owner.lookup('service:settings').hiddenStationsFeatureEnabled = true;
  });

  test('with no hidden stations the page shows the empty state and skips the station request', async function (assert) {
    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;

    await visit('/hidden');
    await waitFor('[data-test-hidden-empty]');

    assert.dom('[data-test-hidden-empty]').exists();
    assert.dom(HIDDEN_CARD_SELECTOR).doesNotExist();
    assert.strictEqual(countStationRequests(store.calls), 0);
  });

  test('the navbar does not link to the hidden page', async function (assert) {
    await visit('/hidden');

    assert.dom('[data-test-navbar-link="hidden"]').doesNotExist();

    await click('[data-test-navbar-mobile-menu-button]');

    assert
      .dom('[data-test-navbar-mobile-menu] [data-test-navbar-link="hidden"]')
      .doesNotExist();
  });

  test('the page renders the hidden stations in the order they were hidden', async function (assert) {
    const hiddenStations = this.owner.lookup('service:hidden-stations');

    // Added in reverse of STATION_FIXTURES to pin the ordering behaviour.
    hiddenStations.add('slf-PMA2');
    hiddenStations.add('meteoswiss-PMA');

    await visit('/hidden');
    await waitFor(HIDDEN_CARD_SELECTOR);

    const titles = findAll(
      `${HIDDEN_CARD_SELECTOR} [data-test-station-title]`
    ).map((element) => element.textContent?.trim());

    assert.deepEqual(
      titles,
      ['Colms da Parsonz', 'Piz Martegnas'],
      'cards follow the order stations were hidden, not the response order'
    );
  });

  test('a card on the page unhides its station', async function (assert) {
    const hiddenStations = this.owner.lookup('service:hidden-stations');

    hiddenStations.add('slf-PMA2');

    await visit('/hidden');
    await waitFor(`${HIDDEN_CARD_SELECTOR} [data-test-station-hide]`);

    await click(`${HIDDEN_CARD_SELECTOR} [data-test-station-hide]`);

    assert.deepEqual(hiddenStations.stationIds, []);
  });

  test('settings lists the hidden stations and links to the hidden page', async function (assert) {
    const hiddenStations = this.owner.lookup('service:hidden-stations');

    hiddenStations.add('slf-PMA2');

    await visit('/settings');
    await waitFor('[data-test-settings-hidden-station="slf-PMA2"]');

    assert
      .dom('[data-test-settings-hidden-station="slf-PMA2"]')
      .includesText('Colms da Parsonz');

    await click('[data-test-settings-hidden-link]');

    assert.strictEqual(currentURL(), '/hidden');
  });

  test('settings shows an empty note when nothing is hidden', async function (assert) {
    await visit('/settings');

    assert.dom('[data-test-settings-hidden-empty]').exists();
    assert.dom('[data-test-settings-hidden-link]').exists();
  });

  test('settings has no hidden-stations box while the feature is off', async function (assert) {
    this.owner.lookup('service:settings').hiddenStationsFeatureEnabled = false;

    await visit('/settings');

    assert.dom('[data-test-settings-hidden-stations]').doesNotExist();
  });
});
