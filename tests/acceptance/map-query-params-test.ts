/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { module, test } from 'qunit';
import { currentURL, settled, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { createFakeMapRuntime } from 'winds-mobi-client-web/tests/helpers/fake-map-runtime';
import {
  resetMapRuntimeForTest,
  setMapRuntimeForTest,
} from 'winds-mobi-client-web/utils/map-runtime';

type FakeRuntime = ReturnType<typeof createFakeMapRuntime>;

function countStationRequests(fetchCalls: string[]) {
  return fetchCalls.filter((url) => url.includes('/stations?')).length;
}

module('Acceptance | map query params', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    const fakeRuntime = createFakeMapRuntime();

    this.fakeRuntime = fakeRuntime;
    this.fetchCalls = [] as string[];
    this.originalFetch = globalThis.fetch;

    setMapRuntimeForTest(fakeRuntime.runtime);

    globalThis.fetch = (input) => {
      const url = input instanceof Request ? input.url : String(input);
      (this.fetchCalls as string[]).push(url);

      return Promise.resolve(
        new Response(JSON.stringify({ content: [] }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    };
  });

  hooks.afterEach(function () {
    resetMapRuntimeForTest();
    globalThis.fetch = this.originalFetch;
  });

  test('it uses the URL view for the initial map and station request', async function (assert) {
    const fakeRuntime = this.fakeRuntime as FakeRuntime;
    const fetchCalls = this.fetchCalls as string[];

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');
    fakeRuntime.maps[0]?.setLoaded(true);
    fakeRuntime.maps[0]?.emit('load');

    assert.strictEqual(
      currentURL(),
      '/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5'
    );
    assert.strictEqual(fakeRuntime.maps.length, 1);
    assert.deepEqual(fakeRuntime.maps[0]?.options.center, [8.12345, 46.54321]);
    assert.strictEqual(fakeRuntime.maps[0]?.options.zoom, 9.5);
    assert.strictEqual(fakeRuntime.legendControls.length, 1);
    assert.dom('[data-test-map-wind-legend]').exists();
    assert.true(
      fetchCalls.some(
        (url) =>
          url.includes('near-lat=46.54321') && url.includes('near-lon=8.12345')
      )
    );
  });

  test('it does not refetch stations for tiny map view changes', async function (assert) {
    const fakeRuntime = this.fakeRuntime as FakeRuntime;
    const fetchCalls = this.fetchCalls as string[];

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');

    const initialStationRequestCount = countStationRequests(fetchCalls);

    fakeRuntime.maps[0]?.setView([8.12844, 46.5482], 9.6);
    fakeRuntime.maps[0]?.emit('moveend');

    await settled();

    assert.strictEqual(
      currentURL(),
      '/map?mapLng=8.12844&mapLat=46.5482&mapZoom=9.6'
    );
    assert.strictEqual(
      countStationRequests(fetchCalls),
      initialStationRequestCount
    );
  });

  test('it refetches stations after the request threshold is crossed', async function (assert) {
    const fakeRuntime = this.fakeRuntime as FakeRuntime;
    const fetchCalls = this.fetchCalls as string[];

    await visit('/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5');

    const initialStationRequestCount = countStationRequests(fetchCalls);

    fakeRuntime.maps[0]?.setView([8.14345, 46.54321], 9.5);
    fakeRuntime.maps[0]?.emit('moveend');

    await settled();

    assert.strictEqual(
      currentURL(),
      '/map?mapLng=8.14345&mapLat=46.54321&mapZoom=9.5'
    );
    assert.strictEqual(
      countStationRequests(fetchCalls),
      initialStationRequestCount + 1
    );
    assert.true(
      fetchCalls.some(
        (url) =>
          url.includes('near-lat=46.54321') && url.includes('near-lon=8.14345')
      )
    );
  });
});
