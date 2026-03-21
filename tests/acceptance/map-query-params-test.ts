/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { module, test } from 'qunit';
import { currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { createFakeMapRuntime } from 'winds-mobi-client-web/tests/helpers/fake-map-runtime';
import {
  resetMapRuntimeForTest,
  setMapRuntimeForTest,
} from 'winds-mobi-client-web/utils/map-runtime';

type FakeRuntime = ReturnType<typeof createFakeMapRuntime>;

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

    assert.strictEqual(
      currentURL(),
      '/map?mapLng=8.12345&mapLat=46.54321&mapZoom=9.5'
    );
    assert.strictEqual(fakeRuntime.maps.length, 1);
    assert.deepEqual(fakeRuntime.maps[0]?.options.center, [8.12345, 46.54321]);
    assert.strictEqual(fakeRuntime.maps[0]?.options.zoom, 9.5);
    assert.dom('[data-test-map-wind-legend]').exists();
    assert.true(
      fetchCalls.some(
        (url) =>
          url.includes('near-lat=46.54321') && url.includes('near-lon=8.12345')
      )
    );
  });
});
