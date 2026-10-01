import { module, test } from 'qunit';
import { click, currentURL, visit } from '@ember/test-helpers';
import { Type } from '@warp-drive/core/types/symbols';
import { setupApplicationTest } from 'winds-mobi-client-web/tests/helpers';
import {
  setupStubbedApi,
  stationsApi,
} from 'winds-mobi-client-web/tests/helpers/stub-api';
import type { History, Station } from 'winds-mobi-client-web/services/store';
import { stationFixture } from 'winds-mobi-client-web/tests/helpers/station-fixture';

const STATION_FIXTURE: Station = stationFixture();

const HISTORY_FIXTURES: History[] = [
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
];

module('Acceptance | help route', function (hooks) {
  setupApplicationTest(hooks);
  const api = setupStubbedApi(hooks);

  hooks.beforeEach(function () {
    api.respond = stationsApi({
      stations: [STATION_FIXTURE],
      history: HISTORY_FIXTURES,
    });
  });

  test('it shows the help page and live station example', async function (assert) {
    await visit('/help');

    assert.dom('[data-test-navbar-link="help"]').exists();
    assert.dom('[data-test-navbar-link="help"]').hasText('Help');
    assert.dom('[data-test-station-title]').hasText('Holfuy 1804');
    assert.dom('[data-test-station-summary-section]').exists();
    assert.dom('[data-test-station-wind-section]').exists();
    assert.dom('[data-test-station-air-section]').exists();
    assert.dom('[data-test-station-provider-link]').includesText('Holfuy');
    assert.dom('[data-test-help-changelog]').exists();
    assert.dom('[data-test-help-changelog-version]').hasText('unreleased');
    assert
      .dom('[data-test-help-changelog-link]')
      .hasAttribute(
        'href',
        'https://github.com/winds-mobi/winds-mobi-client-web/blob/main/CHANGELOG.md'
      );
    assert
      .dom('[data-test-help-discord-link]')
      .hasAttribute('href', 'https://discord.gg/6VU23xDv5v');
  });

  test('it navigates to help from the mobile menu without reloading the app', async function (assert) {
    await visit('/all');

    await click('[data-test-navbar-mobile-menu-button]');

    assert.dom('[data-test-navbar-mobile-menu]').exists();

    await click(
      '[data-test-navbar-mobile-menu] [data-test-navbar-link="help"]'
    );

    assert.strictEqual(currentURL(), '/help');
    assert.dom('[data-test-navbar-mobile-menu]').doesNotExist();
    assert.dom('[data-test-help-changelog]').exists();
  });
});
