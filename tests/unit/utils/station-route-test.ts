import { module, test } from 'qunit';
import {
  stationRouteNameForTab,
  stationTabFromRouteName,
} from 'winds-mobi-client-web/utils/station-route';

module('Unit | Utility | station-route', function () {
  test('it resolves the station tab from the current route name', function (assert) {
    assert.strictEqual(stationTabFromRouteName('map'), 'summary');
    assert.strictEqual(stationTabFromRouteName('map.station'), 'summary');
    assert.strictEqual(
      stationTabFromRouteName('map.station.summary'),
      'summary'
    );
    assert.strictEqual(stationTabFromRouteName('map.station.winds'), 'winds');
    assert.strictEqual(stationTabFromRouteName('map.station.air'), 'air');
  });

  test('it resolves route names from station tabs', function (assert) {
    assert.strictEqual(
      stationRouteNameForTab('summary'),
      'map.station.summary'
    );
    assert.strictEqual(stationRouteNameForTab('winds'), 'map.station.winds');
    assert.strictEqual(stationRouteNameForTab('air'), 'map.station.air');
  });
});
