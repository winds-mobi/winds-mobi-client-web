import Service from '@ember/service';
import { module, test } from 'qunit';
import { click, currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { OVERLAPPING_STATIONS } from 'winds-mobi-client-web/tests/helpers/station-fixture';

type FakeStoreRequest = {
  url?: string;
};

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

    const singleStation = OVERLAPPING_STATIONS.find((station) =>
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
            ? OVERLAPPING_STATIONS.filter((station) => ids.includes(station.id))
            : OVERLAPPING_STATIONS,
      },
      // WarpDrive's `<Request>` `state.refresh()` replays the request it
      // finds echoed back on a resolved response -- without it, a refresh
      // resolves against an empty/unknown request instead of this same URL.
      request,
    });
  }
}

const HIDDEN_CARD_SELECTOR = '[data-test-nearby-station-card]';

module('Acceptance | hidden stations', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;
    this.owner.lookup('service:settings').hiddenStationsFeatureEnabled = true;
  });

  test('the navbar does not link to the hidden page', async function (assert) {
    await visit('/hidden');

    assert.dom('[data-test-navbar-link="hidden"]').doesNotExist();

    await click('[data-test-navbar-mobile-menu-button]');

    assert
      .dom('[data-test-navbar-mobile-menu] [data-test-navbar-link="hidden"]')
      .doesNotExist();
  });

  test('a card on the page unhides its station', async function (assert) {
    const hiddenStations = this.owner.lookup('service:hidden-stations');

    hiddenStations.add('slf-PMA2');

    await visit('/hidden');

    await click(`${HIDDEN_CARD_SELECTOR} [data-test-station-hide]`);

    assert.deepEqual(hiddenStations.stationIds, []);
  });

  test('settings lists the hidden stations and links to the hidden page', async function (assert) {
    const hiddenStations = this.owner.lookup('service:hidden-stations');

    hiddenStations.add('slf-PMA2');

    await visit('/settings');

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
