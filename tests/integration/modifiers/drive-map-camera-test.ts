import { module, test } from 'qunit';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { MapView } from 'winds-mobi-client-web/utils/map-view';

type FakeCall = { method: string; args: unknown[] };
type FakePadding = { top: number; bottom: number; left: number; right: number };

// Just enough of MapLibre's `Map` to exercise `applyMapPadding`'s real
// arithmetic (project/unproject/getCenter/getPadding) and the two camera
// methods this modifier chooses between -- stateful like the real thing:
// `jumpTo`/`flyTo` actually update what `getCenter`/`getPadding` report
// afterwards, since `applyMapPadding`'s own "is this a no-op" check
// (`mapPaddingsEqual` against the *current* padding) only means anything
// against a map that remembers its last move.
function fakeMap() {
  const calls: FakeCall[] = [];
  let center = { lng: 8.2275, lat: 46.8011 };
  let padding: FakePadding = { top: 0, bottom: 0, left: 0, right: 0 };

  const map = {
    getPadding: () => padding,
    getCenter: () => center,
    // A fixed screen point regardless of the geographic input: sufficient
    // for `applyMapPadding`'s vanishing-point math to run without NaNs, and
    // this test only asserts *which* method drive-map-camera itself calls
    // and with what -- not `applyMapPadding`'s own arithmetic, which every
    // acceptance test opening/closing a real station panel already covers.
    project: () => ({ x: 960, y: 480 }),
    unproject: (point: { x: number; y: number }) => ({
      lng: 8.2275 + point.x / 100_000,
      lat: 46.8011 + point.y / 100_000,
    }),
    jumpTo: (options: {
      center?: [number, number];
      zoom?: number;
      padding?: FakePadding;
    }) => {
      calls.push({ method: 'jumpTo', args: [options] });

      if (options.center) {
        center = { lng: options.center[0], lat: options.center[1] };
      }

      if (options.padding) {
        padding = options.padding;
      }
    },
    flyTo: (options: { center?: [number, number]; zoom?: number }) => {
      calls.push({ method: 'flyTo', args: [options] });

      if (options.center) {
        center = { lng: options.center[0], lat: options.center[1] };
      }
    },
    on: () => {},
    off: () => {},
  };

  return { map, calls };
}

const VIEW: MapView = { latitude: 46.67719, longitude: 7.86323, zoom: 13 };

module('Integration | Modifier | drive-map-camera', function (hooks) {
  setupRenderingTest(hooks);

  test('a map that just finished loading is one jump, already padded for its breakpoint', async function (assert) {
    const { map, calls } = fakeMap();

    this.setProperties({ map, view: VIEW, isSidePanel: false });

    await render(
      hbs`<div {{drive-map-camera this.map this.view this.isSidePanel}}></div>`
    );

    assert.strictEqual(calls.length, 1, 'exactly one camera call');
    assert.strictEqual(
      calls[0]?.method,
      'jumpTo',
      'a jump, not a fly -- there is nothing on screen yet to fly away from'
    );
    assert.deepEqual(calls[0]?.args[0], {
      center: [VIEW.longitude, VIEW.latitude],
      zoom: VIEW.zoom,
      padding: { top: 0, bottom: 480, left: 0, right: 0 },
      // A bottom sheet: `isSidePanel` is false above. The panel's padding is
      // reserved from the very first jump, whether or not a station panel is
      // actually open yet -- it never toggles, only the breakpoint does.
    });
  });

  test('a side-panel breakpoint pads the left edge instead of the bottom', async function (assert) {
    const { map, calls } = fakeMap();

    this.setProperties({ map, view: VIEW, isSidePanel: true });

    await render(
      hbs`<div {{drive-map-camera this.map this.view this.isSidePanel}}></div>`
    );

    assert.deepEqual(calls[0]?.args[0], {
      center: [VIEW.longitude, VIEW.latitude],
      zoom: VIEW.zoom,
      padding: { top: 0, bottom: 0, left: 480, right: 0 },
    });
  });

  test('a breakpoint flip on a map that is already up is absorbed by padding, no fly', async function (assert) {
    const { map, calls } = fakeMap();

    this.setProperties({ map, view: VIEW, isSidePanel: false });

    await render(
      hbs`<div {{drive-map-camera this.map this.view this.isSidePanel}}></div>`
    );

    calls.length = 0; // Only care about what happens once the breakpoint flips.
    this.set('isSidePanel', true);
    await settled();

    assert.deepEqual(
      calls.map((call) => call.method),
      ['jumpTo'],
      'the view did not change, so nothing flies -- only padding moves, absorbed by one jump'
    );
  });

  test('a genuinely new routed view, on a map already up, flies rather than jumping', async function (assert) {
    const { map, calls } = fakeMap();

    this.setProperties({ map, view: VIEW, isSidePanel: false });

    await render(
      hbs`<div {{drive-map-camera this.map this.view this.isSidePanel}}></div>`
    );

    calls.length = 0;
    this.set('view', { latitude: 47.1234, longitude: 8.5678, zoom: 10 });
    await settled();

    assert.deepEqual(
      calls.map((call) => call.method),
      ['flyTo'],
      'the destination genuinely changed, so this is a fly -- padding was already settled, unchanged'
    );
  });
});
