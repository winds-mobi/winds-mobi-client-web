import { module, test } from 'qunit';
import { type TestContext, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import {
  setupStubbedApi,
  stationsApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import { hasWebGL } from 'winds-mobi-client-web/tests/helpers/webgl';
import { OVERLAPPING_STATIONS } from 'winds-mobi-client-web/tests/helpers/station-fixture';

// These render real markers, which needs a working MapLibre — see
// tests/helpers/webgl.ts.
const webGLAvailable = hasWebGL();

module('Acceptance | map hidden stations (#167)', function (hooks) {
  setupApplicationTest(hooks);
  const api = setupStubbedApi(hooks);

  hooks.beforeEach(function () {
    api.respond = stationsApi({ stations: OVERLAPPING_STATIONS });
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
