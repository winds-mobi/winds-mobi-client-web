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
  waitUntil,
} from '@ember/test-helpers';
import MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { stubMatchMedia } from 'winds-mobi-client-web/tests/helpers/match-media';
import { hasWebGL } from 'winds-mobi-client-web/tests/helpers/webgl';
import type { History, Station } from 'winds-mobi-client-web/services/store';

// Only the two refresh tests below depend on MapLibre's `idle` event; the
// rest of this module exercises the panel via direct station-id fetches
// unrelated to map bounds — see tests/helpers/webgl.ts.
const webGLAvailable = hasWebGL();

// `<map.marker>` adds its element to the map asynchronously (real WebGL
// context/canvas setup), and Ember's test helpers have no visibility into
// that -- `await visit(...)` resolving doesn't mean the marker DOM exists
// yet. These tests were always skipped before this container had real
// WebGL (see tests/helpers/webgl.ts), so this gap was never exercised.
// Waiting for the marker directly, rather than for a broader MapLibre
// lifecycle event, keeps this independent of the `idle`-only tests above.
async function waitForMarker(stationId: string) {
  await waitUntil(() => find(`[data-station-id="${stationId}"]`) !== null, {
    timeout: 5000,
  });
}

// Where MapLibre currently draws a station's marker, relative to the map's own
// box, so it measures the camera rather than where the page happens to sit.
function markerPosition(stationId: string) {
  const map = find('[data-test-map-container]')?.getBoundingClientRect();
  const marker = find(
    `[data-station-id="${stationId}"]`
  )?.getBoundingClientRect();

  return map && marker
    ? { x: marker.x - map.x, y: marker.y - map.y, width: marker.width }
    : undefined;
}

// MapLibre's camera animations run outside anything `settled()` knows about, so
// a map that is merely slow to leave still looks still right after a click.
// Long enough for MapLibre's own default ease (500ms) to have visibly started.
function afterAnyCameraAnimation() {
  return new Promise((resolve) => setTimeout(resolve, 400));
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

const PRIMARY_STATION: Station = {
  id: 'holfuy-1804',
  altitude: 1804,
  latitude: 46.67719,
  longitude: 7.86323,
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
};

const SECONDARY_STATION: Station = {
  id: 'holfuy-2222',
  altitude: 2222,
  latitude: 46.70719,
  longitude: 7.91323,
  isPeak: true,
  providerName: 'Holfuy',
  providerUrl: 'https://example.com/stations/holfuy-2222',
  name: 'Holfuy 2222',
  last: {
    timestamp: 1_710_003_600_000,
    direction: 280,
    speed: 20,
    gusts: 28,
    temperature: 4,
    humidity: 50,
    pressure: 1009,
    rain: 0,
  },
  [Type]: 'station',
};

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
    Promise<{ content: { data: History[] | Station | Station[] } }>
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
      });
      this.requestCache.set(url, cachedRequest);
      return cachedRequest;
    }

    if (url.includes('/stations/holfuy-1804/?')) {
      cachedRequest = Promise.resolve({
        content: {
          data: PRIMARY_STATION,
        },
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
      });
      this.requestCache.set(url, cachedRequest);
      return cachedRequest;
    }

    if (url.includes('/stations/?')) {
      cachedRequest = Promise.resolve({
        content: {
          data: [PRIMARY_STATION, SECONDARY_STATION],
        },
      });
      this.requestCache.set(url, cachedRequest);
      return cachedRequest;
    }

    cachedRequest = Promise.resolve({
      content: {
        data: [],
      },
    });
    this.requestCache.set(url, cachedRequest);

    return cachedRequest;
  }
}

class ShortIntervalMapRefreshService extends MapRefreshService {
  refreshIntervalMs = 75;
  countdownTickMs = 10;
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

// Opts into the click-the-map-to-dismiss beta feature, which needs both the
// master beta toggle and its own. Written through the real settings service so
// its in-memory cell and localStorage stay in step; `setupApplicationTest`
// clears both before every test.
function enableMapClickDismiss(context: TestContext) {
  const settings = context.owner.lookup('service:settings');

  settings.betaFeaturesEnabled = true;
  settings.mapClickClosesPanel = true;
}

function countStationListRequests(calls: string[]) {
  return calls.filter((url) => url.includes('/stations/?')).length;
}

function countStationDetailRequests(calls: string[], stationId: string) {
  return calls.filter((url) => url.includes(`/stations/${stationId}/?`)).length;
}

function countHistoryRequests(calls: string[], stationId: string) {
  return calls.filter((url) => url.includes(`/stations/${stationId}/historic/`))
    .length;
}

const STATION_HISTORY_REQUESTS_PER_REFRESH = 3;

module('Acceptance | map station panel', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function (this: MapStationPanelTestContext) {
    this.deferredSecondaryStationRequest = undefined;

    this.owner.register('service:store', FakeStoreService);
  });

  test('it deep-links the panel and map state from the URL', async function (assert) {
    await visit('/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13');

    assertCurrentRoute(assert, '/map/holfuy-1804', {
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
        '/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13'
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
        '/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13'
      );

      assert.dom('[data-test-station-panel-placement="bottom"]').exists();
    } finally {
      restoreMatchMedia();
    }
  });

  test('it closes on escape and preserves map query params', async function (assert) {
    await visit('/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13');
    await triggerKeyEvent('[data-test-station-panel]', 'keydown', 'Escape');

    await waitUntil(() =>
      new URL(currentURL(), 'https://winds.mobi').pathname.startsWith('/map')
    );

    assertCurrentRoute(assert, '/map', {
      latitude: '46.67719',
      longitude: '7.86323',
      zoom: '13',
    });
    assert.dom('[data-test-station-panel]').doesNotExist();
  });

  test('it renders the wind and air history charts with the loaded history', async function (assert) {
    await visit('/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13');

    assert
      .dom('[data-test-station-wind-section] .highcharts-container')
      .exists('the wind history chart renders');
    assert
      .dom('[data-test-station-air-section] .highcharts-container')
      .exists('the air history chart renders');
  });

  test('it zooms in to the open station when its name is clicked', async function (this: MapStationPanelTestContext, assert) {
    await visit('/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=8');
    await click('[data-test-station-title]');

    assertCurrentRoute(assert, '/map/holfuy-1804', {
      latitude: '46.67719',
      longitude: '7.86323',
      zoom: '10',
    });
  });

  test('it closes from the explicit close button and preserves map query params', async function (this: MapStationPanelTestContext, assert) {
    await visit('/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13');
    await click('[data-test-station-close]');

    assertCurrentRoute(assert, '/map', {
      latitude: '46.67719',
      longitude: '7.86323',
      zoom: '13',
    });
    assert.dom('[data-test-station-panel]').doesNotExist();
  });

  test('it stays open when the panel itself is clicked', async function (this: MapStationPanelTestContext, assert) {
    await visit('/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13');
    await click('[data-test-station-panel]');

    assertCurrentRoute(assert, '/map/holfuy-1804', {
      latitude: '46.67719',
      longitude: '7.86323',
      zoom: '13',
    });
    assert.dom('[data-test-station-panel]').exists();
  });

  // #157, a beta feature: clicking the map dismisses the panel only once both
  // "Enable beta features" and its own toggle are on (see
  // app/services/settings.ts). The click has to land on MapLibre's own canvas,
  // the element inside the container that MapLibre actually listens on — a
  // click on the outer container never reaches it, so it would prove nothing.
  test.if(
    'it does not close when the map is clicked while the beta feature is off',
    webGLAvailable,
    async function (this: MapStationPanelTestContext, assert) {
      await visit(
        '/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13'
      );
      await waitForMarker('holfuy-1804');

      await click('.maplibregl-canvas');

      assertCurrentRoute(assert, '/map/holfuy-1804', {
        latitude: '46.67719',
        longitude: '7.86323',
        zoom: '13',
      });
      assert.dom('[data-test-station-panel]').exists();
    }
  );

  test.if(
    'it closes when the map itself is clicked and preserves map query params',
    webGLAvailable,
    async function (this: MapStationPanelTestContext, assert) {
      enableMapClickDismiss(this);

      await visit(
        '/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13'
      );
      await waitForMarker('holfuy-1804');

      await click('.maplibregl-canvas');

      assertCurrentRoute(assert, '/map', {
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
      enableMapClickDismiss(this);

      await visit(
        '/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13'
      );
      await waitForMarker('holfuy-1804');

      await click('.maplibregl-ctrl-zoom-in');
      await afterAnyCameraAnimation();

      assert.dom('[data-test-station-panel]').exists('the panel is still open');
      assert.strictEqual(
        new URL(currentURL(), 'https://winds.mobi').pathname,
        '/map/holfuy-1804',
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
      enableMapClickDismiss(this);

      await visit(
        '/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13'
      );
      await waitForMarker('holfuy-2222');

      await click('[data-station-id="holfuy-2222"]');

      assertCurrentRoute(assert, '/map/holfuy-2222', {
        latitude: '46.67719',
        longitude: '7.86323',
        zoom: '13',
      });
      assert.dom('[data-test-station-title]').hasText('Holfuy 2222');
    }
  );

  test('it keeps the current map view when transitioning to another station', async function (assert) {
    const router = this.owner.lookup('service:router');

    await visit('/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13');
    void router.transitionTo('map.station', 'holfuy-2222', {
      queryParams: {
        latitude: 46.67719,
        longitude: 7.86323,
        zoom: 13,
      },
    });

    await settled();

    assertCurrentRoute(assert, '/map/holfuy-2222', {
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

    await visit('/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13');
    void router.transitionTo('map.station', 'holfuy-2222', {
      queryParams: {
        latitude: 46.67719,
        longitude: 7.86323,
        zoom: 13,
      },
    });

    // Deliberately polls the URL rather than awaiting `settled()`/the
    // transition promise directly: the deferred station request above is
    // still pending by design, and fully awaiting either one lets enough
    // of the app settle that the assertions below (the mid-loading state)
    // no longer catch anything -- confirmed empirically, not just in theory.
    await waitUntil(() => currentURL().startsWith('/map/holfuy-2222?'));

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

  test.if(
    'it force refreshes map and station requests from the navbar button',
    webGLAvailable,
    async function (this: MapStationPanelTestContext, assert) {
      const store = this.owner.lookup(
        'service:store'
      ) as unknown as FakeStoreService;

      await visit(
        '/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13'
      );

      await waitUntil(() => countStationListRequests(store.calls) > 0);

      const initialStationListRequests = countStationListRequests(store.calls);
      const initialStationDetailRequests = countStationDetailRequests(
        store.calls,
        'holfuy-1804'
      );
      const initialHistoryRequests = countHistoryRequests(
        store.calls,
        'holfuy-1804'
      );

      await click('[data-test-navbar-refresh]');

      assert.true(
        countStationListRequests(store.calls) >= initialStationListRequests + 1
      );
      assert.strictEqual(
        countStationDetailRequests(store.calls, 'holfuy-1804'),
        initialStationDetailRequests + 1
      );
      assert.strictEqual(
        countHistoryRequests(store.calls, 'holfuy-1804'),
        initialHistoryRequests + STATION_HISTORY_REQUESTS_PER_REFRESH
      );
    }
  );

  test.if(
    'it auto refreshes map and station requests after the refresh interval',
    webGLAvailable,
    async function (this: MapStationPanelTestContext, assert) {
      this.owner.register(
        'service:map-refresh',
        ShortIntervalMapRefreshService
      );

      const store = this.owner.lookup(
        'service:store'
      ) as unknown as FakeStoreService;

      await visit(
        '/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13'
      );

      const initialStationListRequests = countStationListRequests(store.calls);
      const initialStationDetailRequests = countStationDetailRequests(
        store.calls,
        'holfuy-1804'
      );
      const initialHistoryRequests = countHistoryRequests(
        store.calls,
        'holfuy-1804'
      );

      await waitUntil(
        () =>
          countStationListRequests(store.calls) > initialStationListRequests &&
          countStationDetailRequests(store.calls, 'holfuy-1804') >
            initialStationDetailRequests &&
          countHistoryRequests(store.calls, 'holfuy-1804') >
            initialHistoryRequests
      );

      assert.true(
        countStationListRequests(store.calls) >= initialStationListRequests + 1
      );
      assert.true(
        countStationDetailRequests(store.calls, 'holfuy-1804') >=
          initialStationDetailRequests + 1
      );
      assert.true(
        countHistoryRequests(store.calls, 'holfuy-1804') >=
          initialHistoryRequests + STATION_HISTORY_REQUESTS_PER_REFRESH
      );
    }
  );

  test('it shows the selected station as the browser favicon and restores it on close', async function (assert) {
    await visit('/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13');

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

    await click('[data-test-station-close]');

    assert.dom("link[type='image/svg+xml']", document.head).doesNotExist();
  });

  // `cursor-pointer` deliberately lives on MapLibre's own marker element
  // (passed via `markerInitOptions`'s `className`), not on anything inside
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
        '/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13'
      );
      await waitForMarker('holfuy-1804');

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
      await visit('/map?latitude=46.67719&longitude=7.86323&zoom=13');
      await waitForMarker('holfuy-2222');

      const before = markerPosition('holfuy-2222');

      await click('[data-station-id="holfuy-1804"]');
      await waitForMarker('holfuy-2222');

      assert.dom('[data-test-station-panel]').exists('the panel opened');
      assert.deepEqual(
        markerPosition('holfuy-2222'),
        before,
        'the other station’s marker has not moved on screen'
      );

      await afterAnyCameraAnimation();

      assert.deepEqual(
        markerPosition('holfuy-2222'),
        before,
        'and has not drifted once any camera animation would have run'
      );

      await click('[data-test-station-close]');
      await waitForMarker('holfuy-2222');

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
        '/map/holfuy-1804?latitude=46.70719&longitude=7.91323&zoom=8'
      );
      await waitForMarker('holfuy-1804');

      await click('[data-test-station-title]');
      await waitForMarker('holfuy-1804');
      await afterAnyCameraAnimation();

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
        '/map/holfuy-1804?latitude=46.67719&longitude=7.86323&zoom=13'
      );
      await waitForMarker('holfuy-1804');

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

      void router.transitionTo('map.station', 'holfuy-2222', {
        queryParams: {
          latitude: 46.67719,
          longitude: 7.86323,
          zoom: 13,
        },
      });
      await settled();
      await waitForMarker('holfuy-2222');

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
