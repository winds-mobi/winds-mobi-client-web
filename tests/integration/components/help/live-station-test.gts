import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';

import {
  setupRenderingTest,
  type RenderedTestContext,
} from 'winds-mobi-client-web/tests/helpers';
import {
  apiError,
  setupStubbedApi,
  stationsApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import type { Station } from 'winds-mobi-client-web/services/store';
import HelpLiveStation from 'winds-mobi-client-web/components/help/live-station';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

interface HelpLiveStationTestContext extends RenderedTestContext {
  stationId: string;
}

const STATION: Station = stationFixture({ last: { timestamp: Date.now() } });

module('Integration | Component | help/live-station', function (hooks) {
  setupRenderingTest(hooks);
  const api = setupStubbedApi(hooks);

  hooks.beforeEach(function () {
    api.respond = stationsApi({ stations: [STATION] });
  });

  test('it renders the station once loaded', async function (this: HelpLiveStationTestContext, assert) {
    const stationId: HelpLiveStationTestContext['stationId'] = 'holfuy-1804';

    await render(
      <template><HelpLiveStation @stationId={{stationId}} /></template>
    );

    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
  });

  test('it shows an error message when the request fails', async function (this: HelpLiveStationTestContext, assert) {
    api.respond = () => apiError();
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
