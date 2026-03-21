/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { module, test } from 'qunit';
import {
  click,
  currentURL,
  settled,
  visit,
  waitUntil,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { createFakeMapRuntime } from 'winds-mobi-client-web/tests/helpers/fake-map-runtime';
import {
  resetMapRuntimeForTest,
  setMapRuntimeForTest,
} from 'winds-mobi-client-web/utils/map-runtime';

type FakeRuntime = ReturnType<typeof createFakeMapRuntime>;

const PRIMARY_STATION = {
  _id: 'holfuy-1804',
  'pv-name': 'Holfuy',
  short: 'Holfuy 1804',
  name: 'Holfuy 1804',
  alt: 1804,
  peak: false,
  status: 'online',
  loc: {
    coordinates: [7.86323, 46.67719],
  },
  url: {
    en: 'https://example.com/stations/holfuy-1804',
  },
  last: {
    _id: 1710000000,
    'w-dir': 240,
    'w-avg': 12,
    'w-max': 18,
    temp: 7,
    hum: 65,
    rain: 0,
    pres: 1012,
  },
};

const SECONDARY_STATION = {
  _id: 'holfuy-2222',
  'pv-name': 'Holfuy',
  short: 'Holfuy 2222',
  name: 'Holfuy 2222',
  alt: 2222,
  peak: true,
  status: 'online',
  loc: {
    coordinates: [7.91323, 46.70719],
  },
  url: {
    en: 'https://example.com/stations/holfuy-2222',
  },
  last: {
    _id: 1710003600,
    'w-dir': 280,
    'w-avg': 20,
    'w-max': 28,
    temp: 4,
    hum: 50,
    rain: 0,
    pres: 1009,
  },
};

const HISTORY = [
  {
    _id: 1710000000,
    'w-dir': 240,
    'w-avg': 12,
    'w-max': 18,
    temp: 7,
    hum: 65,
  },
  {
    _id: 1710003600,
    'w-dir': 250,
    'w-avg': 14,
    'w-max': 20,
    temp: 8,
    hum: 61,
  },
];

function jsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  );
}

module('Acceptance | map station panel', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    const fakeRuntime = createFakeMapRuntime();

    this.fakeRuntime = fakeRuntime;
    this.originalFetch = globalThis.fetch;

    setMapRuntimeForTest(fakeRuntime.runtime);

    globalThis.fetch = (input) => {
      const url = input instanceof Request ? input.url : String(input);

      if (url.includes('/historic/')) {
        return jsonResponse({ content: HISTORY });
      }

      if (url.includes('/stations/holfuy-1804?')) {
        return jsonResponse({ content: PRIMARY_STATION });
      }

      if (url.includes('/stations/holfuy-2222?')) {
        return jsonResponse({ content: SECONDARY_STATION });
      }

      if (url.includes('/stations?')) {
        return jsonResponse({ content: [PRIMARY_STATION, SECONDARY_STATION] });
      }

      return jsonResponse({ content: [] });
    };
  });

  hooks.afterEach(function () {
    resetMapRuntimeForTest();
    globalThis.fetch = this.originalFetch;
  });

  test('it deep-links the panel and map state from the URL', async function (assert) {
    const fakeRuntime = this.fakeRuntime as FakeRuntime;

    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');

    assert.strictEqual(
      currentURL(),
      '/map/holfuy-1804?mapLng=7.86323&mapLat=46.67719&mapZoom=13'
    );
    assert.strictEqual(fakeRuntime.maps.length, 1);
    assert.deepEqual(fakeRuntime.maps[0]?.options.center, [7.86323, 46.67719]);
    assert.strictEqual(fakeRuntime.maps[0]?.options.zoom, 13);
    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
    assert.dom('[data-test-station-panel]').exists();
    assert.dom('[data-test-station-summary-section]').exists();
    assert.dom('[data-test-station-wind-section]').exists();
    assert.dom('[data-test-station-air-section]').exists();
  });

  test('it closes from the explicit close button and preserves map query params', async function (assert) {
    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');
    await click('[data-test-station-close]');
    await waitUntil(
      () => currentURL() === '/map?mapLng=7.86323&mapLat=46.67719&mapZoom=13'
    );

    assert.strictEqual(
      currentURL(),
      '/map?mapLng=7.86323&mapLat=46.67719&mapZoom=13'
    );
    assert.dom('[data-test-station-panel]').doesNotExist();
  });

  test('it does not close when clicking outside the panel', async function (assert) {
    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');
    await click('[data-test-map-container]');

    assert.strictEqual(
      currentURL(),
      '/map/holfuy-1804?mapLng=7.86323&mapLat=46.67719&mapZoom=13'
    );
    assert.dom('[data-test-station-panel]').exists();
  });

  test('it keeps the station route when selecting another station from the map', async function (assert) {
    const fakeRuntime = this.fakeRuntime as FakeRuntime;

    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');

    const stationsLayer = fakeRuntime.overlays[0]?.props.layers.find(
      (layer) => layer.id === 'stations'
    ) as
      | {
          props: {
            data: unknown[];
            onClick: (info: { object?: unknown }) => void;
          };
        }
      | undefined;

    stationsLayer?.props.onClick({
      object: stationsLayer.props.data[1],
    });

    await settled();

    assert.true(currentURL().startsWith('/map/holfuy-2222?'));
    assert.true(currentURL().includes('mapLng=7.86323'));
    assert.true(currentURL().includes('mapLat=46.67719'));
    assert.true(currentURL().includes('mapZoom=13'));
    assert.dom('[data-test-station-title]').hasText('Holfuy 2222');
  });

  test('it updates only the map query params when the map view changes with the panel open', async function (assert) {
    const fakeRuntime = this.fakeRuntime as FakeRuntime;

    await visit('/map/holfuy-1804?mapLat=46.67719&mapLng=7.86323&mapZoom=13');

    fakeRuntime.maps[0]?.setView([8.111111, 46.222222], 9.678);
    fakeRuntime.maps[0]?.emit('moveend');

    await settled();

    assert.strictEqual(
      currentURL(),
      '/map/holfuy-1804?mapLng=8.11111&mapLat=46.22222&mapZoom=9.68'
    );
    assert.dom('[data-test-station-panel]').exists();
  });
});
