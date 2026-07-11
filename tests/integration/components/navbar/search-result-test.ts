import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import {
  setupRenderingTest,
  type RenderedTestContext,
} from 'winds-mobi-client-web/tests/helpers';
import { windBandForSpeed } from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { Station } from 'winds-mobi-client-web/services/store';

interface NavbarSearchResultTestContext extends RenderedTestContext {
  station: Station;
}

const STATION: Station = {
  id: 'holfuy-1850',
  altitude: 560,
  latitude: 46.68084,
  longitude: 7.82554,
  isPeak: false,
  providerName: 'holfuy.com',
  providerUrl: 'https://example.com/stations/holfuy-1850',
  name: 'Lehn',
  last: {
    timestamp: 1_710_000_000_000,
    direction: 30,
    speed: 8.5,
    gusts: 22,
    temperature: 12,
    humidity: 60,
    pressure: 1010,
    rain: 0,
  },
  [Type]: 'station',
};

module('Integration | Component | navbar/search-result', function (hooks) {
  setupRenderingTest(hooks);

  test('it shows the name, wind speed, and band colour', async function (this: NavbarSearchResultTestContext, assert) {
    this.station = STATION;

    await render(hbs`<Navbar::SearchResult @station={{this.station}} />`);

    assert.dom(this.element).includesText('Lehn');
    assert.dom(this.element).includesText('8.5 km/h');

    const band = windBandForSpeed(8.5);
    assert.dom('.size-2').hasClass(band.backgroundClass);
  });

  test('it uses zero fraction digits at or above 10 km/h', async function (this: NavbarSearchResultTestContext, assert) {
    this.station = { ...STATION, last: { ...STATION.last, speed: 12 } };

    await render(hbs`<Navbar::SearchResult @station={{this.station}} />`);

    assert.dom(this.element).includesText('12 km/h');
  });

  test('it omits the distance when the current position is unknown', async function (this: NavbarSearchResultTestContext, assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    nearbyLocation.coordinates = undefined;
    this.station = STATION;

    await render(hbs`<Navbar::SearchResult @station={{this.station}} />`);

    assert.dom('.mt-0\\.5').doesNotExist();
  });

  test('it shows the distance when the current position is known', async function (this: NavbarSearchResultTestContext, assert) {
    const nearbyLocation = this.owner.lookup('service:nearby-location');
    nearbyLocation.coordinates = {
      accuracy: 10,
      latitude: 46.69299,
      longitude: 7.82667,
    };
    this.station = STATION;

    await render(hbs`<Navbar::SearchResult @station={{this.station}} />`);

    // ~1.35km great-circle distance between the two points, rounded to one
    // decimal place under 10km.
    assert.dom('.mt-0\\.5').hasText('1.4 km');
  });
});
