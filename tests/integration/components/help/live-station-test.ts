import Service from '@ember/service';
import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import {
  setupRenderingTest,
  type RenderedTestContext,
} from 'winds-mobi-client-web/tests/helpers';
import type { Station } from 'winds-mobi-client-web/services/store';

interface HelpLiveStationTestContext extends RenderedTestContext {
  stationId: string;
}

const STATION: Station = {
  id: 'holfuy-1804',
  altitude: 1804,
  latitude: 46.67719,
  longitude: 7.86323,
  isPeak: false,
  providerName: 'Holfuy',
  providerUrl: 'https://example.com/stations/holfuy-1804',
  name: 'Holfuy 1804',
  last: {
    timestamp: Date.now(),
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

type FakeStoreRequest = {
  url?: string;
};

class FakeStoreService extends Service {
  stationResponse: Promise<unknown> = Promise.resolve({
    content: { data: STATION },
  });

  request(request: FakeStoreRequest) {
    const url = request.url ?? '';

    if (url.includes('/historic/')) {
      return Promise.resolve({ content: { data: [] } });
    }

    return this.stationResponse;
  }
}

module('Integration | Component | help/live-station', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', FakeStoreService);
  });

  test('it renders the station once loaded', async function (this: HelpLiveStationTestContext, assert) {
    this.stationId = 'holfuy-1804';

    await render(hbs`<Help::LiveStation @stationId={{this.stationId}} />`);

    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
  });

  test('it shows an error message when the request fails', async function (this: HelpLiveStationTestContext, assert) {
    const store = this.owner.lookup(
      'service:store'
    ) as unknown as FakeStoreService;
    const rejection = Promise.reject(new Error('boom'));

    rejection.catch(() => {
      // Prevent an unhandled-rejection warning.
    });
    store.stationResponse = rejection;
    this.stationId = 'holfuy-1804';

    await render(hbs`<Help::LiveStation @stationId={{this.stationId}} />`);

    assert
      .dom(this.element)
      .includesText('The live station example could not be loaded right now.');
    assert.dom('[data-test-station-title]').doesNotExist();
  });
});
