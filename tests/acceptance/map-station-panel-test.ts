import Service from '@ember/service';
import { Type } from '@warp-drive/core/types/symbols';
import { module, test } from 'qunit';
import {
  click,
  currentURL,
  find,
  settled,
  type TestContext,
  triggerKeyEvent,
  visit,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { stubMatchMedia } from 'winds-mobi-client-web/tests/helpers/match-media';
import { hasWebGL } from 'winds-mobi-client-web/tests/helpers/webgl';
import type { History, Station } from 'winds-mobi-client-web/services/store';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

// Tests that drive the map itself (markers, clicks, the camera) need real
// WebGL — see tests/helpers/webgl.ts.
const webGLAvailable = hasWebGL();

// Where MapLibre currently draws a station's marker, relative to the map's own
// box, so it measures the camera rather than where the page happens to sit.
// Rounded to whole pixels: MapLibre settles a marker's transform onto the pixel
// grid as the map finishes rendering, so the same unmoved marker can measure
// 588.77 one moment and 589 the next. That sub-pixel difference is not a move,
// and comparing raw floats would fail on it.
function markerPosition(stationId: string) {
  const map = find('[data-test-map-container]')?.getBoundingClientRect();
  const marker = find(
    `[data-station-id="${stationId}"]`
  )?.getBoundingClientRect();

  return map && marker
    ? {
        x: Math.round(marker.x - map.x),
        y: Math.round(marker.y - map.y),
        width: Math.round(marker.width),
      }
    : undefined;
}

type DeferredRequest = {
  promise: Promise<{ content: { data: Station } }>;
  resolve: (value: { content: { data: Station } }) => void;
};

type FakeStoreRequest = {
  url?: string;
};

type MapStationPanelTestContext = TestContext & {
  deferredSecondaryStationRequest?: DeferredRequest;
};

const PRIMARY_STATION: Station = stationFixture();

const SECONDARY_STATION: Station = stationFixture({
  id: 'holfuy-2222',
  altitude: 2222,
  latitude: 46.70719,
  longitude: 7.91323,
  isPeak: true,
  name: 'Holfuy 2222',
  last: {
    timestamp: 1_710_003_600_000,
    direction: 280,
    speed: 20,
    gusts: 28,
    temperature: 4,
    humidity: 50,
    pressure: 1009,
  },
});

const HISTORY: History[] = [
  {
    id: '1710000000',
    direction: 240,
    speed: 12,
    gusts: 18,
    temperature: 7,
    humidity: 65,
    rain: 0,
    timestamp: 1_710_000_000_000,
    [Type]: 'history',
  },
  {
    id: '1710003600',
    direction: 250,
    speed: 14,
    gusts: 20,
    temperature: 8,
    humidity: 61,
    rain: 0,
    timestamp: 1_710_003_600_000,
    [Type]: 'history',
  },
];

class FakeStoreService extends Service {
  calls: string[] = [];
  deferredSecondaryStationRequest?: DeferredRequest;
  private requestCache = new Map<
    string,
    Promise<{
      content: { data: History[] | Station | Station[] };
      request?: FakeStoreRequest;
    }>
  >();

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';
    this.calls.push(url);

    let cachedRequest = this.requestCache.get(url);

    if (cachedRequest) {
      return cachedRequest;
    }

    if (url.includes('/historic/')) {
      cachedRequest = Promise.resolve({
        content: {
          data: HISTORY,
        },
        request,
      });
      this.requestCache.set(url, cachedRequest);
      return cachedRequest;
    }

    if (url.includes('/stations/holfuy-1804/?')) {
      cachedRequest = Promise.resolve({
        content: {
          data: PRIMARY_STATION,
        },
        request,
      });
      this.requestCache.set(url, cachedRequest);
      return cachedRequest;
    }

    if (url.includes('/stations/holfuy-2222/?')) {
      if (this.deferredSecondaryStationRequest) {
        cachedRequest = this.deferredSecondaryStationRequest.promise;
        this.requestCache.set(url, cachedRequest);
        return cachedRequest;
      }

      cachedRequest = Promise.resolve({
        content: {
          data: SECONDARY_STATION,
        },
        request,
      });
      this.requestCache.set(url, cachedRequest);
      return cachedRequest;
    }

    if (url.includes('/stations/?')) {
      cachedRequest = Promise.resolve({
        content: {
          data: [PRIMARY_STATION, SECONDARY_STATION],
        },
        request,
      });
      this.requestCache.set(url, cachedRequest);
      return cachedRequest;
    }

    cachedRequest = Promise.resolve({
      content: {
        data: [],
      },
      request,
    });
    this.requestCache.set(url, cachedRequest);

    return cachedRequest;
  }
}

function createDeferredRequest(): DeferredRequest {
  let resolve!: (value: { content: { data: Station } }) => void;

  const promise = new Promise<{ content: { data: Station } }>(
    (resolvePromise) => {
      resolve = resolvePromise;
    }
  );

  return { promise, resolve };
}

function assertCurrentRoute(
  assert: Assert,
  expectedPathname: string,
  expectedQueryParams: Record<string, string>
) {
  const url = new URL(currentURL(), 'https://winds.mobi');

  assert.strictEqual(url.pathname, expectedPathname);
  assert.deepEqual(
    Object.fromEntries(url.searchParams.entries()),
    expectedQueryParams
  );
}

module('Acceptance | map station panel', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function (this: MapStationPanelTestContext) {
    this.deferredSecondaryStationRequest = undefined;

    this.owner.register('service:store', FakeStoreService);
  });

  test('it deep-links the panel and map state from the URL', async function (assert) {
    await visit(
      '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
    );

    assertCurrentRoute(assert, '/all', {
      station: 'holfuy-1804',
      latitude: '46.67719',
      longitude: '7.86323',
      zoom: '13',
    });
    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
    assert.dom('[data-test-station-panel]').includesText('1,804 m');
    assert.dom('[data-test-station-panel]').exists();
    assert.dom('[data-test-station-summary-section]').exists();
    assert.dom('[data-test-station-wind-section]').exists();
    assert.dom('[data-test-station-air-section]').exists();
  });

  test('it uses a side-panel placement in landscape/desktop', async function (assert) {
    const restoreMatchMedia = stubMatchMedia(true);

    try {
      await visit(
        '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
      );

      assert.dom('[data-test-station-panel-placement="left"]').exists();
    } finally {
      restoreMatchMedia();
    }
  });

  test('it uses a bottom-sheet placement in portrait/mobile', async function (assert) {
    const restoreMatchMedia = stubMatchMedia(false);

    try {
      await visit(
        '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
      );

      assert.dom('[data-test-station-panel-placement="bottom"]').exists();
    } finally {
      restoreMatchMedia();
    }
  });

  test('it closes on escape and preserves map query params', async function (assert) {
    await visit(
      '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
    );
    await triggerKeyEvent('[data-test-station-panel]', 'keydown', 'Escape');

    assertCurrentRoute(assert, '/all', {
      latitude: '46.67719',
      longitude: '7.86323',
      zoom: '13',
    });
    assert.dom('[data-test-station-panel]').doesNotExist();
  });

  test('it renders the wind and air history charts with the loaded history', async function (assert) {
    await visit(
      '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
    );

    assert
      .dom('[data-test-station-wind-section] .highcharts-container')
      .exists('the wind history chart renders');
    assert
      .dom('[data-test-station-air-section] .highcharts-container')
      .exists('the air history chart renders');
  });

  test('it zooms in to the open station when its name is clicked', async function (this: MapStationPanelTestContext, assert) {
    await visit(
      '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=8'
    );
    await click('[data-test-station-title]');

    assertCurrentRoute(assert, '/all', {
      station: 'holfuy-1804',
      latitude: '46.67719',
      longitude: '7.86323',
      zoom: '10',
    });
  });

  test('it closes from the explicit close button and preserves map query params', async function (this: MapStationPanelTestContext, assert) {
    await visit(
      '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
    );
    await click('[data-part="header-close-button"]');

    assertCurrentRoute(assert, '/all', {
      latitude: '46.67719',
      longitude: '7.86323',
      zoom: '13',
    });
    assert.dom('[data-test-station-panel]').doesNotExist();
  });

  test('it stays open when the panel itself is clicked', async function (this: MapStationPanelTestContext, assert) {
    await visit(
      '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
    );
    await click('[data-test-station-panel]');

    assertCurrentRoute(assert, '/all', {
      station: 'holfuy-1804',
      latitude: '46.67719',
      longitude: '7.86323',
      zoom: '13',
    });
    assert.dom('[data-test-station-panel]').exists();
  });

  // #157: clicking the map dismisses the panel. The click has to land on
  // MapLibre's own canvas, the element inside the container that MapLibre
  // actually listens on — a click on the outer container never reaches it, so
  // it would prove nothing.
  test.if(
    'it closes when the map itself is clicked and preserves map query params',
    webGLAvailable,
    async function (this: MapStationPanelTestContext, assert) {
      await visit(
        '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
      );

      await click('.maplibregl-canvas');

      assertCurrentRoute(assert, '/all', {
        latitude: '46.67719',
        longitude: '7.86323',
        zoom: '13',
      });
      assert.dom('[data-test-station-panel]').doesNotExist();
    }
  );

  // The zoom, compass and 3D buttons and the wind legend all live in MapLibre's
  // own control container, a sibling of the canvas container it listens on — a
  // click on one never reaches the map at all, so none of them has to opt out of
  // the dismiss above, now or when another control is added.
  test.if(
    'it stays open when a map control is clicked',
    webGLAvailable,
    async function (this: MapStationPanelTestContext, assert) {
      await visit(
        '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
      );

      await click('.maplibregl-ctrl-zoom-in');

      assert.dom('[data-test-station-panel]').exists('the panel is still open');
      assert.strictEqual(
        new URL(currentURL(), 'https://winds.mobi').searchParams.get('station'),
        'holfuy-1804',
        'and the station is still the routed one'
      );
    }
  );

  // A marker's click reaches the map too, so without the marker consuming it
  // this would open the other station and then immediately close it again.
  test.if(
    'it switches stations when another marker is clicked, rather than closing',
    webGLAvailable,
    async function (this: MapStationPanelTestContext, assert) {
      await visit(
        '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
      );

      await click('[data-station-id="holfuy-2222"]');

      assertCurrentRoute(assert, '/all', {
        station: 'holfuy-2222',
        latitude: '46.67719',
        longitude: '7.86323',
        zoom: '13',
      });
      assert.dom('[data-test-station-title]').hasText('Holfuy 2222');
    }
  );

  test('it keeps the current map view when transitioning to another station', async function (assert) {
    const router = this.owner.lookup('service:router');

    await visit(
      '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
    );
    void router.transitionTo('all', {
      queryParams: {
        station: 'holfuy-2222',
        latitude: 46.67719,
        longitude: 7.86323,
        zoom: 13,
      },
    });

    await settled();

    assertCurrentRoute(assert, '/all', {
      station: 'holfuy-2222',
      latitude: '46.67719',
      longitude: '7.86323',
      zoom: '13',
    });
    assert.dom('[data-test-station-title]').hasText('Holfuy 2222');
  });

  test('it keeps the panel shell mounted while the next station loads', async function (this: MapStationPanelTestContext, assert) {
    const router = this.owner.lookup('service:router');
    const deferredRequest = createDeferredRequest();
    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;

    this.deferredSecondaryStationRequest = deferredRequest;
    store.deferredSecondaryStationRequest = deferredRequest;

    await visit(
      '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
    );
    void router.transitionTo('all', {
      queryParams: {
        station: 'holfuy-2222',
        latitude: 46.67719,
        longitude: 7.86323,
        zoom: 13,
      },
    });

    // The deferred station request isn't a test waiter, so `settled()`
    // resolves with it still pending: the panel is mid-way through loading.
    await settled();

    assert.dom('[data-test-station-panel]').exists();
    assert.dom('[data-test-station-title]').doesNotExist();

    deferredRequest.resolve({
      content: {
        data: SECONDARY_STATION,
      },
    });

    this.deferredSecondaryStationRequest = undefined;
    store.deferredSecondaryStationRequest = undefined;

    await settled();

    assert.dom('[data-test-station-title]').hasText('Holfuy 2222');
  });

  test('it shows the selected station as the browser favicon and restores it on close', async function (assert) {
    await visit(
      '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
    );

    assert
      .dom("link[type='image/svg+xml']", document.head)
      .exists('a favicon link is rendered into the document head')
      .hasAttribute(
        'href',
        /^data:image\/svg\+xml,/,
        'the favicon is an inline svg data uri'
      )
      .hasAttribute(
        'href',
        // direction 240 + the 180° arrow offset (the arrow points where the
        // wind blows *to*).
        /rotate\(420/,
        "the favicon arrow points to the station's wind direction"
      );

    await click('[data-part="header-close-button"]');

    assert.dom("link[type='image/svg+xml']", document.head).doesNotExist();
  });

  // `cursor-pointer` deliberately lives on MapLibre's own marker element
  // (passed via `STATION_MARKER_OPTIONS`'s `className`), not on anything inside
  // `<MapStationMarker>` -- that outer element is what `<marker.on
  // @event="click">` actually listens on (see `map/station-marker.gts`'s
  // top-of-file comment for why click is routed through it rather than a
  // second clickable element). This reads the real DOM MapLibre produced to
  // confirm the option actually reached it, not just that we passed it.
  test.if(
    'the map marker element itself gets the pointer cursor, not just its inner content',
    webGLAvailable,
    async function (assert) {
      await visit(
        '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
      );

      assert
        .dom('[data-station-id="holfuy-1804"].cursor-pointer')
        .doesNotExist(
          'the inner marker content no longer carries its own cursor-pointer'
        );
      assert
        .dom(
          '.maplibregl-marker.cursor-pointer:has([data-station-id="holfuy-1804"])'
        )
        .exists('the outer MapLibre marker element carries it instead');
    }
  );

  // #155: opening the panel used to shrink the map's own box, and MapLibre
  // keeps its geographic centre through a resize, so everything on screen slid
  // by half the panel. The panel overlays the map now, and the padding that
  // tells the camera about the covered area is applied so the view holds still
  // (`applyMapPadding`) -- both of which are invisible to any assertion about
  // the DOM alone. Where MapLibre actually draws a marker is the observable
  // proof, and it's proof about our own layout and camera handling rather than
  // about how MapLibre chooses to draw: any correct implementation leaves that
  // marker on the same pixel.
  test.if(
    'opening a station panel leaves the map exactly where it was',
    webGLAvailable,
    async function (assert) {
      await visit('/all?latitude=46.67719&longitude=7.86323&zoom=13');

      const before = markerPosition('holfuy-2222');

      await click('[data-station-id="holfuy-1804"]');

      assert.dom('[data-test-station-panel]').exists('the panel opened');
      assert.deepEqual(
        markerPosition('holfuy-2222'),
        before,
        'the other station’s marker has not moved on screen'
      );

      assert.deepEqual(
        markerPosition('holfuy-2222'),
        before,
        'and has not drifted once any camera animation would have run'
      );

      await click('[data-part="header-close-button"]');

      assert.deepEqual(
        markerPosition('holfuy-2222'),
        before,
        'and closing the panel puts nothing back either — it never moved'
      );
    }
  );

  // The flip side of the test above: an overlaying panel hides part of the map,
  // so a station the app deliberately focuses (a search result, a nearby card,
  // its own title here) has to land in the part the panel leaves visible, not
  // behind it. That's what MapLibre's padding buys once it's set -- without it
  // this station would sit in the middle of the whole map, which on a phone is
  // under the sheet.
  test.if(
    'focusing a station frames it in the part of the map the panel leaves visible',
    webGLAvailable,
    async function (assert) {
      await visit(
        '/all?station=holfuy-1804&latitude=46.70719&longitude=7.91323&zoom=8'
      );

      await click('[data-test-station-title]');

      // Same units as `markerPosition`, which measures against this same box.
      const mapWidth =
        find('[data-test-map-container]')?.getBoundingClientRect().width ?? 0;
      const marker = markerPosition('holfuy-1804');

      assert.ok(
        marker && marker.x + marker.width / 2 > mapWidth / 2,
        'the focused station sits clear of the panel, not at the centre of the whole map'
      );
    }
  );

  // The selected-station ring/disc is toggled by the `selectMapMarker`
  // modifier directly on MapLibre's own marker element (the same element
  // `cursor-pointer` lives on, see the test above), not on anything inside
  // `<MapStationMarker>` -- reactively, since which station is selected
  // changes over the page's lifetime (unlike `cursor-pointer`, which is
  // static and set once via `className`). This reads the real DOM to
  // confirm the ring actually follows selection from one station to
  // another, not just that it's present on the initially-selected one.
  test.if(
    'the selected-station ring lives on the map marker element and follows selection',
    webGLAvailable,
    async function (this: MapStationPanelTestContext, assert) {
      const router = this.owner.lookup('service:router');

      await visit(
        '/all?station=holfuy-1804&latitude=46.67719&longitude=7.86323&zoom=13'
      );

      assert
        .dom(
          '.maplibregl-marker.bg-slate-400\\/40:has([data-station-id="holfuy-1804"])'
        )
        .exists('the initially-selected station has the ring');
      assert
        .dom(
          '.maplibregl-marker.bg-slate-400\\/40:has([data-station-id="holfuy-2222"])'
        )
        .doesNotExist('the other station does not');

      void router.transitionTo('all', {
        queryParams: {
          station: 'holfuy-2222',
          latitude: 46.67719,
          longitude: 7.86323,
          zoom: 13,
        },
      });
      await settled();

      assert
        .dom(
          '.maplibregl-marker.bg-slate-400\\/40:has([data-station-id="holfuy-1804"])'
        )
        .doesNotExist('the previously-selected station no longer has it');
      assert
        .dom(
          '.maplibregl-marker.bg-slate-400\\/40:has([data-station-id="holfuy-2222"])'
        )
        .exists('the newly-selected station has it instead');
    }
  );
});
