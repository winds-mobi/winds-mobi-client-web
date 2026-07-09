import { module, test } from 'qunit';
import { requestAndFly } from 'winds-mobi-client-web/utils/locate';
import type RouterService from '@ember/routing/router-service';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';

function fakeNearbyLocation(
  coordinates?: { latitude: number; longitude: number },
  requestCurrentPosition: () => Promise<void> = () => Promise.resolve()
) {
  return {
    coordinates,
    requestCurrentPosition,
  } as unknown as NearbyLocationService;
}

function fakeRouter(currentRouteName: string | null) {
  const replaceWithCalls: unknown[] = [];

  const router = {
    currentRouteName,
    replaceWith(...args: unknown[]) {
      replaceWithCalls.push(args[0]);
      return Promise.resolve();
    },
  } as unknown as RouterService;

  return { router, replaceWithCalls };
}

module('Unit | Utility | locate', function () {
  test('it flies the map to the located position when on a map route', async function (assert) {
    const nearbyLocation = fakeNearbyLocation({
      latitude: 46.521,
      longitude: 6.632,
    });
    const { router, replaceWithCalls } = fakeRouter('map.station');

    await requestAndFly(nearbyLocation, router);

    assert.strictEqual(replaceWithCalls.length, 1);
    assert.deepEqual(replaceWithCalls[0], {
      queryParams: { latitude: 46.521, longitude: 6.632, zoom: 10 },
    });
  });

  test('it does nothing when not on a map route', async function (assert) {
    const nearbyLocation = fakeNearbyLocation({
      latitude: 46.521,
      longitude: 6.632,
    });
    const { router, replaceWithCalls } = fakeRouter('nearby');

    await requestAndFly(nearbyLocation, router);

    assert.strictEqual(replaceWithCalls.length, 0);
  });

  test('it does nothing when the position request yields no coordinates', async function (assert) {
    const nearbyLocation = fakeNearbyLocation(undefined);
    const { router, replaceWithCalls } = fakeRouter('map');

    await requestAndFly(nearbyLocation, router);

    assert.strictEqual(replaceWithCalls.length, 0);
  });
});
