import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { Station } from 'winds-mobi-client-web/services/store';

type StationHeaderTestContext = {
  station: Station;
};

const BASE_STATION: Omit<Station, 'providerUrl'> = {
  id: 'windline-4109',
  altitude: 1200,
  latitude: 46.7,
  longitude: 7.8,
  isPeak: false,
  providerName: 'windline.ch',
  name: 'Windline 4109',
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

module('Integration | Component | station/header', function (hooks) {
  setupRenderingTest(hooks);

  test('it hides the provider meta item when the provider name is missing', async function (this: StationHeaderTestContext, assert) {
    this.station = {
      ...BASE_STATION,
      providerName: undefined,
    };

    await render(hbs`<Station::Header @station={{this.station}} />`);

    assert.dom('[data-test-station-provider-link]').doesNotExist();
    assert.dom(this.element).doesNotIncludeText('Provider');
  });

  test('it hides the provider meta item when the provider URL is missing', async function (this: StationHeaderTestContext, assert) {
    this.station = {
      ...BASE_STATION,
    };

    await render(hbs`<Station::Header @station={{this.station}} />`);

    assert.dom('[data-test-station-provider-link]').doesNotExist();
    assert.dom(this.element).doesNotIncludeText('Provider');
  });

  test('it renders the provider link when the provider URL is available', async function (this: StationHeaderTestContext, assert) {
    this.station = {
      ...BASE_STATION,
      providerUrl: 'https://windline.ch/station/4109',
    };

    await render(hbs`<Station::Header @station={{this.station}} />`);

    assert
      .dom('[data-test-station-provider-link]')
      .hasAttribute('href', 'https://windline.ch/station/4109');
  });
});
