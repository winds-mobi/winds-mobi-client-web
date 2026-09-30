import Service from '@ember/service';
import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';

import {
  setupRenderingTest,
  type RenderedTestContext,
} from 'winds-mobi-client-web/tests/helpers';
import type { Station } from 'winds-mobi-client-web/services/store';
import HelpLiveStation from 'winds-mobi-client-web/components/help/live-station';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

interface HelpLiveStationTestContext extends RenderedTestContext {
  stationId: string;
}

const STATION: Station = stationFixture({ last: { timestamp: Date.now() } });

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
    const stationId: HelpLiveStationTestContext['stationId'] = 'holfuy-1804';

    await render(
      <template><HelpLiveStation @stationId={{stationId}} /></template>
    );

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
    const stationId: HelpLiveStationTestContext['stationId'] = 'holfuy-1804';

    await render(
      <template><HelpLiveStation @stationId={{stationId}} /></template>
    );

    assert
      .dom(this.element)
      .includesText('The live station example could not be loaded right now.');
    assert.dom('[data-test-station-title]').doesNotExist();
  });
});
