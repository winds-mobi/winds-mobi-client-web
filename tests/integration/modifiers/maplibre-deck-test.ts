/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { module, test } from 'qunit';
import { clearRender, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import { createFakeMapRuntime } from 'winds-mobi-client-web/tests/helpers/fake-map-runtime';
import type { DeckLayer } from 'winds-mobi-client-web/utils/map-runtime';
import {
  resetMapRuntimeForTest,
  setMapRuntimeForTest,
} from 'winds-mobi-client-web/utils/map-runtime';

type FakeRuntime = ReturnType<typeof createFakeMapRuntime>;

module('Integration | Modifier | maplibre-deck', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.fakeRuntime = createFakeMapRuntime();
    this.viewChanges = [] as Array<{ coords: [number, number]; zoom: number }>;

    setMapRuntimeForTest(this.fakeRuntime.runtime);
  });

  hooks.afterEach(function () {
    resetMapRuntimeForTest();
  });

  test('it creates the map once and updates layers and view in place', async function (assert) {
    const fakeRuntime = this.fakeRuntime as FakeRuntime;

    this.set('layers', [{ id: 'initial-layer' } as DeckLayer]);
    this.set('longitude', 7.85);
    this.set('latitude', 46.68);
    this.set('zoom', 13);
    this.set('onViewChange', (coords: [number, number], zoom: number) => {
      this.viewChanges.push({ coords, zoom });
    });

    await render(hbs`
      <div
        data-test-map
        class="h-64 w-full"
        {{
          maplibre-deck
          longitude=this.longitude
          latitude=this.latitude
          zoom=this.zoom
          layers=this.layers
          onViewChange=this.onViewChange
        }}
      ></div>
    `);

    assert.strictEqual(fakeRuntime.maps.length, 1);
    assert.strictEqual(fakeRuntime.overlays.length, 1);
    assert.deepEqual(fakeRuntime.maps[0]?.options.center, [7.85, 46.68]);
    assert.strictEqual(fakeRuntime.maps[0]?.options.zoom, 13);

    fakeRuntime.maps[0]?.setLoaded(true);
    fakeRuntime.maps[0]?.emit('load');

    assert.strictEqual(fakeRuntime.maps[0]?.controls.length, 2);
    assert.strictEqual(fakeRuntime.overlays[0]?.props.layers.length, 1);

    this.set('layers', [{ id: 'updated-layer' } as DeckLayer]);
    this.set('longitude', 8.12345);
    this.set('latitude', 46.54321);
    this.set('zoom', 9.5);

    await settled();

    assert.strictEqual(fakeRuntime.maps.length, 1);
    assert.strictEqual(
      fakeRuntime.overlays[0]?.props.layers[0]?.id,
      'updated-layer'
    );
    assert.deepEqual(fakeRuntime.maps[0]?.easeToCalls[0], {
      center: [8.12345, 46.54321],
      zoom: 9.5,
      essential: true,
    });
  });

  test('it emits normalized view changes and cleans up on destroy', async function (assert) {
    const fakeRuntime = this.fakeRuntime as FakeRuntime;
    const viewChanges = this.viewChanges as Array<{
      coords: [number, number];
      zoom: number;
    }>;

    this.set('layers', [] as DeckLayer[]);
    this.set('longitude', 7.85);
    this.set('latitude', 46.68);
    this.set('zoom', 13);
    this.set('onViewChange', (coords: [number, number], zoom: number) => {
      this.viewChanges.push({ coords, zoom });
    });

    await render(hbs`
      <div
        data-test-map
        class="h-64 w-full"
        {{
          maplibre-deck
          longitude=this.longitude
          latitude=this.latitude
          zoom=this.zoom
          layers=this.layers
          onViewChange=this.onViewChange
        }}
      ></div>
    `);

    const map = fakeRuntime.maps[0];

    map?.setLoaded(true);
    map?.setView([8.111111, 46.222222], 9.678);
    map?.emit('moveend');

    assert.deepEqual(viewChanges[0], {
      coords: [8.11111, 46.22222],
      zoom: 9.68,
    });

    await clearRender();

    assert.true(map?.removed);
    assert.strictEqual(map?.offCalls[0]?.event, 'moveend');
  });
});
