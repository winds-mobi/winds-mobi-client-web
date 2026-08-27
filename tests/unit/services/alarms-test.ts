import { module, test } from 'qunit';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import type AlarmsService from 'winds-mobi-client-web/services/alarms';
import type { AlarmConfig } from 'winds-mobi-client-web/services/alarms';

function lookup(context: { owner: { lookup(name: string): unknown } }) {
  return context.owner.lookup('service:alarms') as AlarmsService;
}

function config(stationId: string): AlarmConfig {
  return {
    stationId,
    directionBands: new Array<number | null>(8).fill(null),
    metric: 'gusts',
    createdAt: 0,
  };
}

module('Unit | Service | alarms', function (hooks) {
  setupTest(hooks);

  test('starts with no configured alarms', function (assert) {
    const alarms = lookup(this);

    assert.deepEqual(alarms.configs, {});
    assert.false(alarms.has('holfuy-1804'));
    assert.strictEqual(alarms.get('holfuy-1804'), undefined);
  });

  test('save adds a config retrievable by station id', function (assert) {
    const alarms = lookup(this);

    alarms.save(config('holfuy-1804'));

    assert.true(alarms.has('holfuy-1804'));
    assert.deepEqual(alarms.get('holfuy-1804'), config('holfuy-1804'));
  });

  test('save overwrites an existing config for the same station', function (assert) {
    const alarms = lookup(this);

    alarms.save(config('holfuy-1804'));
    alarms.save({ ...config('holfuy-1804'), metric: 'wind' });

    assert.strictEqual(alarms.get('holfuy-1804')?.metric, 'wind');
    assert.strictEqual(Object.keys(alarms.configs).length, 1);
  });

  test('save does not affect other stations configs', function (assert) {
    const alarms = lookup(this);

    alarms.save(config('holfuy-1804'));
    alarms.save(config('holfuy-2222'));

    assert.true(alarms.has('holfuy-1804'));
    assert.true(alarms.has('holfuy-2222'));
  });

  test('delete removes a config', function (assert) {
    const alarms = lookup(this);

    alarms.save(config('holfuy-1804'));
    alarms.save(config('holfuy-2222'));
    alarms.delete('holfuy-1804');

    assert.false(alarms.has('holfuy-1804'));
    assert.true(alarms.has('holfuy-2222'));
  });

  test('delete on a station with no config is a no-op', function (assert) {
    const alarms = lookup(this);

    alarms.delete('holfuy-1804');

    assert.deepEqual(alarms.configs, {});
  });

  test('triggeredStationIds starts empty', function (assert) {
    const alarms = lookup(this);

    assert.strictEqual(alarms.triggeredStationIds.size, 0);
  });
});
