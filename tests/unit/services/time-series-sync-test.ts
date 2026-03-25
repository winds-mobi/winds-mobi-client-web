import { module, test } from 'qunit';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';

interface StubChart {
  redraw: () => void;
  xAxis: [
    {
      getExtremes: () => {
        min?: number;
        max?: number;
      };
      setExtremes: (
        min?: number,
        max?: number,
        redraw?: boolean,
        animation?: boolean,
        eventArguments?: {
          trigger?: string;
        }
      ) => void;
    },
  ];
}

module('Unit | Service | time-series-sync', function (hooks) {
  setupTest(hooks);

  test('it applies a user-driven range change to the other charts', function (assert) {
    const service = this.owner.lookup('service:time-series-sync');

    let secondaryRange: {
      animation?: boolean;
      eventArguments?: { trigger?: string };
      max?: number;
      min?: number;
      redraw?: boolean;
    } | null = null;
    let redrawCount = 0;

    const primaryChart = createChart();
    const secondaryChart = createChart({
      onSetExtremes(min, max, redraw, animation, eventArguments) {
        secondaryRange = {
          min,
          max,
          redraw,
          animation,
          eventArguments,
        };
      },
      onRedraw() {
        redrawCount++;
      },
    });

    service.registerChart(primaryChart);
    service.registerChart(secondaryChart);
    service.syncRange(primaryChart, 10, 20, 'zoom');

    assert.deepEqual(secondaryRange, {
      min: 10,
      max: 20,
      redraw: false,
      animation: false,
      eventArguments: {
        trigger: 'time-series-sync',
      },
    });
    assert.strictEqual(redrawCount, 1);
  });

  test('it ignores internal chart resets without a trigger', function (assert) {
    const service = this.owner.lookup('service:time-series-sync');
    const primaryChart = createChart();
    const secondaryChart = createChart();

    service.registerChart(primaryChart);
    service.registerChart(secondaryChart);
    service.syncRange(primaryChart, 10, 20, 'zoom');
    service.syncRange(primaryChart, 30, 40);

    assert.deepEqual(secondaryChart.xAxis[0].getExtremes(), {
      min: 10,
      max: 20,
    });
  });

  test('it applies the current shared range to charts that register later', function (assert) {
    const service = this.owner.lookup('service:time-series-sync');
    const primaryChart = createChart();
    const secondaryChart = createChart();

    service.registerChart(primaryChart);
    service.syncRange(primaryChart, 100, 200, 'navigator');
    service.registerChart(secondaryChart);

    assert.deepEqual(secondaryChart.xAxis[0].getExtremes(), {
      min: 100,
      max: 200,
    });
  });

  test('it stores the latest range while unlocked and reapplies it when sync is turned back on', function (assert) {
    const service = this.owner.lookup('service:time-series-sync');
    const primaryChart = createChart();
    const secondaryChart = createChart();

    service.registerChart(primaryChart);
    service.registerChart(secondaryChart);
    service.setSyncEnabled(false);
    service.syncRange(primaryChart, 300, 400, 'pan');

    assert.deepEqual(secondaryChart.xAxis[0].getExtremes(), {});

    service.setSyncEnabled(true);

    assert.deepEqual(secondaryChart.xAxis[0].getExtremes(), {
      min: 300,
      max: 400,
    });
  });
});

function createChart(options?: {
  onRedraw?: () => void;
  onSetExtremes?: (
    min?: number,
    max?: number,
    redraw?: boolean,
    animation?: boolean,
    eventArguments?: {
      trigger?: string;
    }
  ) => void;
}): StubChart {
  let currentRange: { min?: number; max?: number } = {};

  return {
    redraw() {
      options?.onRedraw?.();
    },
    xAxis: [
      {
        getExtremes() {
          return currentRange;
        },
        setExtremes(min, max, redraw, animation, eventArguments) {
          currentRange = { min, max };
          options?.onSetExtremes?.(min, max, redraw, animation, eventArguments);
        },
      },
    ],
  };
}
