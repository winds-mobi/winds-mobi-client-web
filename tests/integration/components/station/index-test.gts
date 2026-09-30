import Service from '@ember/service';
import { module, test } from 'qunit';
import { render, settled, waitUntil } from '@ember/test-helpers';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import { setupStubbedApi } from 'winds-mobi-client-web/tests/helpers/stub-api';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import type { Station } from 'winds-mobi-client-web/services/store';
import StationPanel from 'winds-mobi-client-web/components/station/index';
import { trackedObject } from '@ember/reactive/collections';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

type FakeStoreRequest = { url?: string };

// Never resolves by default, so a request this test hasn't configured a
// response for (the wind/air history sections, in particular) just shows
// their own perpetual loading state rather than throwing.
class FakeStoreService extends Service {
  responses = new Map<
    string,
    Promise<{ content: { data: Station }; request: FakeStoreRequest }>
  >();

  request(request: FakeStoreRequest) {
    return (
      this.responses.get(request.url ?? '') ?? new Promise<never>(() => {})
    );
  }
}

const STATION: Station = stationFixture();

// The raw (pre-handler) API shape of `STATION`, under a given name.
function stationPayload(name: string) {
  return {
    _id: 'holfuy-1804',
    name,
    last: { _id: 1_710_000_000, 'w-dir': 240, 'w-avg': 12, 'w-max': 18 },
  };
}

function stationRequestUrl(stationId: string) {
  return findRecord<Station>('station', stationId).url;
}

module('Integration | Component | station', function (hooks) {
  setupRenderingTest(hooks);

  module('with a fake store', function (hooks) {
    hooks.beforeEach(function () {
      this.owner.register('service:store', FakeStoreService);
    });

    test('shows nothing for the body until a genuinely different station loads', async function (assert) {
      const store = this.owner.lookup(
        'service:store'
      ) as unknown as FakeStoreService;
      const url = stationRequestUrl('holfuy-1804');

      store.responses.set(
        url,
        Promise.resolve({ content: { data: STATION }, request: { url } })
      );

      const state = trackedObject({ stationId: 'holfuy-1804' });
      await render(
        <template><StationPanel @stationId={{state.stationId}} /></template>
      );

      assert.dom('[data-test-station-title]').hasText('Holfuy 1804');

      // A different station has no data yet -- the stale one must not leak in.
      state.stationId = 'holfuy-2222';
      await settled();

      assert
        .dom('[data-test-station-title]')
        .doesNotExist(
          'switching to a different, not-yet-loaded station shows nothing rather than the previous station'
        );
    });
  });

  module('with the real store', function (hooks) {
    const api = setupStubbedApi(hooks);

    test('a refresh re-fetches the open station in place, keeping its data on screen meanwhile', async function (assert) {
      const refresh = this.owner.lookup('service:refresh');
      const stationCalls = () =>
        api.calls.filter((url) => url.includes('/stations/holfuy-1804/?'));

      api.respond = (url) =>
        url.pathname.includes('/historic/')
          ? []
          : stationPayload('Holfuy 1804');

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
});
