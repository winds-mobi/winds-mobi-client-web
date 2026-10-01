import { module, test } from 'qunit';
import { render, settled, waitUntil } from '@ember/test-helpers';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import {
  setupStubbedApi,
  stationsApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import type { Station } from 'winds-mobi-client-web/services/store';
import StationPanel from 'winds-mobi-client-web/components/station/index';
import { trackedObject } from '@ember/reactive/collections';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

const STATION: Station = stationFixture();
const OTHER_STATION: Station = stationFixture({
  id: 'holfuy-2222',
  name: 'Holfuy 2222',
});

// The raw (pre-handler) API shape of `STATION`, under a given name.
function stationPayload(name: string) {
  return {
    _id: 'holfuy-1804',
    name,
    last: { _id: 1_710_000_000, 'w-dir': 240, 'w-avg': 12, 'w-max': 18 },
  };
}

module('Integration | Component | station', function (hooks) {
  setupRenderingTest(hooks);

  const api = setupStubbedApi(hooks);

  test('shows nothing for the body until a genuinely different station loads', async function (assert) {
    // The second station is held until the test releases it, so the panel
    // can be looked at while it's still loading.
    const serve = stationsApi({ stations: [STATION, OTHER_STATION] });
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });

    api.respond = async (url) => {
      if (url.pathname.includes('/stations/holfuy-2222/')) {
        await released;
      }

      return serve(url);
    };

    const state = trackedObject({ stationId: 'holfuy-1804' });
    await render(
      <template><StationPanel @stationId={{state.stationId}} /></template>
    );

    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');

    // A different station has no data yet -- the stale one must not leak in.
    // `settled()` would wait on the held request, so wait for it to start.
    state.stationId = 'holfuy-2222';
    await waitUntil(() =>
      api.calls.some((url) => url.includes('/stations/holfuy-2222/'))
    );

    assert
      .dom('[data-test-station-title]')
      .doesNotExist(
        'switching to a different, not-yet-loaded station shows nothing rather than the previous station'
      );

    release();
    await settled();

    assert.dom('[data-test-station-title]').hasText('Holfuy 2222');
  });

  test('a refresh re-fetches the open station in place, keeping its data on screen meanwhile', async function (assert) {
    const refresh = this.owner.lookup('service:refresh');
    const stationCalls = () =>
      api.calls.filter((url) => url.includes('/stations/holfuy-1804/?'));

    api.respond = (url) =>
      url.pathname.includes('/historic/') ? [] : stationPayload('Holfuy 1804');

    await render(
      <template><StationPanel @stationId="holfuy-1804" /></template>
    );

    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
    assert.strictEqual(stationCalls().length, 1);

    let resolveRefresh!: (payload: unknown) => void;

    api.respond = (url) =>
      url.pathname.includes('/historic/')
        ? []
        : new Promise((resolve) => {
            resolveRefresh = resolve;
          });

    refresh.refreshNow();
    await waitUntil(() => stationCalls().length === 2);

    assert
      .dom('[data-test-station-title]')
      .hasText(
        'Holfuy 1804',
        'still showing the previous data while the refresh is in flight'
      );
    assert
      .dom('[data-test-station-loading]')
      .doesNotExist('a refresh never swaps the panel to its loading state');

    resolveRefresh(stationPayload('Holfuy 1804 renamed'));
    await settled();

    assert.dom('[data-test-station-title]').hasText('Holfuy 1804 renamed');
  });
});
