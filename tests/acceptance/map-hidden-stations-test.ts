import Service from '@ember/service';
import { module, test } from 'qunit';
import { type TestContext, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import { hasWebGL } from 'winds-mobi-client-web/tests/helpers/webgl';
import { Type } from '@warp-drive/core/types/symbols';
import type { Station } from 'winds-mobi-client-web/services/store';

// These render real markers, which needs a working MapLibre — see
// tests/helpers/webgl.ts.
const webGLAvailable = hasWebGL();

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
  private requestCache = new Map<
    string,
    Promise<{ content: { data: Station[] }; request: FakeStoreRequest }>
  >();

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';
    this.calls.push(url);

    let cachedRequest = this.requestCache.get(url);

    if (!cachedRequest) {
      cachedRequest = Promise.resolve({
        content: {
          data: STATION_FIXTURES,
        },
        // WarpDrive's `<Request>` `state.refresh()` replays the request it
        // finds echoed back on a resolved response -- without it, a refresh
        // resolves against an empty/unknown request instead of this same URL.
        request,
      });
      this.requestCache.set(url, cachedRequest);
    }

    return cachedRequest;
  }
}

module('Acceptance | map hidden stations (#167)', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
    this.owner.lookup('service:settings').betaFeaturesEnabled = true;
    this.owner.lookup('service:settings').hiddenStationsFeatureEnabled = true;
  });

  test.if(
    'a hidden station renders no marker at all, so it can no longer overlap another one',
    webGLAvailable,
    async function (this: TestContext, assert) {
      this.owner.lookup('service:hidden-stations').add('slf-PMA2');

      await visit('/all?longitude=9.53&latitude=46.577&zoom=13');
      // Wait for the marker itself, not just the request: `<map.marker>` adds
      // its element asynchronously, so a resolved request doesn't mean the
      // markers are in the DOM yet — and this test is about which ones are.

      assert
        .dom('[data-station-id="meteoswiss-PMA"]')
        .exists('the non-hidden station still gets a marker');
      assert
        .dom('[data-station-id="slf-PMA2"]')
        .doesNotExist('the hidden station gets no marker');
    }
  );

  test.if(
    'with the hidden-stations feature off, hidden stations still render',
    webGLAvailable,
    async function (this: TestContext, assert) {
      this.owner.lookup('service:settings').hiddenStationsFeatureEnabled =
        false;
      this.owner.lookup('service:hidden-stations').add('slf-PMA2');

      await visit('/all?longitude=9.53&latitude=46.577&zoom=13');

      assert.dom('[data-station-id="meteoswiss-PMA"]').exists();
      assert.dom('[data-station-id="slf-PMA2"]').exists();
    }
  );

  test.if(
    'with beta features off, hidden stations still render even if the feature toggle is left on',
    webGLAvailable,
    async function (this: TestContext, assert) {
      this.owner.lookup('service:settings').betaFeaturesEnabled = false;
      this.owner.lookup('service:hidden-stations').add('slf-PMA2');

      await visit('/all?longitude=9.53&latitude=46.577&zoom=13');

      assert.dom('[data-station-id="meteoswiss-PMA"]').exists();
      assert
        .dom('[data-station-id="slf-PMA2"]')
        .exists(
          'no way to unhide it with beta off, so it must not stay hidden'
        );
    }
  );
});
