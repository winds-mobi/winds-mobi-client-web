import Service from '@ember/service';
import { module, test } from 'qunit';
import {
  click,
  currentURL,
  findAll,
  type TestContext,
  visit,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { hasWebGL } from 'winds-mobi-client-web/tests/helpers/webgl';
import { OVERLAPPING_STATIONS } from 'winds-mobi-client-web/tests/helpers/station-fixture';

// The map view waits on MapLibre actually initializing — see tests/helpers/webgl.ts.
const webGLAvailable = hasWebGL();

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

    return Promise.resolve({
      content: {
        data: OVERLAPPING_STATIONS,
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

module('Acceptance | hidden route', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;
    this.owner.lookup('service:settings').hiddenStationsFeatureEnabled = true;
  });

  test('with no hidden stations it shows the empty state and skips the station request', async function (assert) {
    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;

    await visit('/hidden');

    assert.dom('[data-test-id-list-empty="hidden"]').exists();
    assert.dom(HIDDEN_CARD_SELECTOR).doesNotExist();
    assert.strictEqual(countStationRequests(store.calls), 0);
  });

  test('it renders the hidden stations in the order they were hidden', async function (assert) {
    const hiddenStations = this.owner.lookup('service:hidden-stations');

    // Added in reverse of OVERLAPPING_STATIONS to pin the ordering behaviour.
    hiddenStations.add('slf-PMA2');
    hiddenStations.add('meteoswiss-PMA');

    await visit('/hidden');

    assert.dom('[data-test-id-list-empty="hidden"]').doesNotExist();

    const titles = findAll(
      `${HIDDEN_CARD_SELECTOR} [data-test-station-title]`
    ).map((element) => element.textContent?.trim());

    assert.deepEqual(
      titles,
      ['Colms da Parsonz', 'Piz Martegnas'],
      'cards follow the order stations were hidden, not the response order'
    );
  });

  test('the navbar view switch switches between full and compact cards', async function (assert) {
    const hiddenStations = this.owner.lookup('service:hidden-stations');

    hiddenStations.add('meteoswiss-PMA');
    hiddenStations.add('slf-PMA2');

    await visit('/hidden');

    assert.dom('[data-test-navbar-view-switch="hidden"]').exists();
    assert.dom('[data-test-station-grid-compact="hidden"]').doesNotExist();
    assert
      .dom('[data-test-nearby-station-card-compact]')
      .doesNotExist('compact cards are not rendered in card view');

    await click('[data-test-navbar-view-option="compact"]');

    assert
      .dom(HIDDEN_CARD_SELECTOR)
      .doesNotExist('full cards are not rendered in compact view');
    assert
      .dom('[data-test-nearby-station-card-compact]')
      .exists({ count: OVERLAPPING_STATIONS.length });
  });

  test.if(
    'the map is a third view of the same list, not a separate page',
    webGLAvailable,
    async function (this: TestContext, assert) {
      const hiddenStations = this.owner.lookup('service:hidden-stations');

      hiddenStations.add('meteoswiss-PMA');
      hiddenStations.add('slf-PMA2');

      await visit('/hidden');
      await click('[data-test-navbar-view-option="map"]');

      assert.dom('[data-test-station-map-view]').exists();
      assert
        .dom(HIDDEN_CARD_SELECTOR)
        .doesNotExist('the cards give way to the map');
      assert.dom('[data-station-id="slf-PMA2"]').exists();

      // It is the same map component the map route renders, so a list's map
      // is not a lesser one: it gets the real controls and legend too.
      assert
        .dom('[data-test-station-map-view] .maplibregl-ctrl-zoom-in')
        .exists('the list map has the real zoom controls');
      assert
        .dom('[data-test-station-map-view] [data-test-map-wind-legend]')
        .exists('and the wind legend');
      assert.strictEqual(
        currentURL(),
        '/hidden?view=map',
        'switching view stays on the same route and adds no camera params'
      );
    }
  );

  test.if(
    'clicking a marker opens that station over the hidden list, not the main map',
    webGLAvailable,
    async function (this: TestContext, assert) {
      const hiddenStations = this.owner.lookup('service:hidden-stations');

      hiddenStations.add('slf-PMA2');

      await visit('/hidden?view=map');
      await click('[data-station-id="slf-PMA2"]');

      const url = new URL(currentURL(), 'https://winds.mobi');

      assert.strictEqual(
        url.pathname,
        '/hidden',
        'opening a station never leaves the current surface'
      );
      assert.deepEqual(Object.fromEntries(url.searchParams.entries()), {
        view: 'map',
        station: 'slf-PMA2',
      });
      assert.dom('[data-test-station-panel]').exists();
    }
  );
});
