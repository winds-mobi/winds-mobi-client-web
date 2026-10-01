import { module, test } from 'qunit';
import { findAll, render } from '@ember/test-helpers';

import {
  setupRenderingTest,
  type RenderedTestContext,
} from 'winds-mobi-client-web/tests/helpers';
import { setupStubbedApi } from 'winds-mobi-client-web/tests/helpers/stub-api';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { Station } from 'winds-mobi-client-web/services/store';
import StationCompactCard from 'winds-mobi-client-web/components/station/compact-card';
import { trackedObject } from '@ember/reactive/collections';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

interface StationCompactCardTestContext extends RenderedTestContext {
  station: Station;
}

const STATION: Station = stationFixture({
  last: { timestamp: Date.now() - 5 * 60 * 1000 },
});

module('Integration | Component | station/compact-card', function (hooks) {
  setupRenderingTest(hooks);
  setupStubbedApi(hooks);

  test('it renders the name, altitude, and wind speed/gusts', async function (this: StationCompactCardTestContext, assert) {
    const station: StationCompactCardTestContext['station'] = STATION;

    await render(
      <template><StationCompactCard @station={{station}} /></template>
    );

    assert
      .dom(`[data-test-nearby-station-card-compact="${STATION.id}"]`)
      .exists();
    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
    assert.dom(this.element).includesText('1,804');
    assert.dom(this.element).includesText('12');
    assert.dom(this.element).includesText('18');
  });

  test('it shows the peak icon only for peak stations', async function (this: StationCompactCardTestContext, assert) {
    const state = trackedObject({ station: { ...STATION, isPeak: false } });

    await render(
      <template><StationCompactCard @station={{state.station}} /></template>
    );
    assert.dom('svg', findAll('dl')[0]).doesNotExist();

    state.station = { ...STATION, isPeak: true };
    await render(
      <template><StationCompactCard @station={{state.station}} /></template>
    );
    assert.dom('svg', findAll('dl')[0]).exists();
  });

  test('it colours the wind speed by its band', async function (this: StationCompactCardTestContext, assert) {
    const station: StationCompactCardTestContext['station'] = STATION;

    await render(
      <template><StationCompactCard @station={{station}} /></template>
    );

    const speedDd = findAll('dd').find(
      (element) => element.textContent?.trim() === '12'
    );

    assert.true(
      speedDd?.classList.contains(windToTextClass(STATION.last.speed))
    );
  });
});
