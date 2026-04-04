import Component from '@glimmer/component';
import type { History } from 'winds-mobi-client-web/services/store.js';
import { service } from '@ember/service';
import { type IntlService } from 'ember-intl';
import Polar from 'winds-mobi-client-web/components/chart/polar';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';

export interface WindDirectionGraphSignature {
  Args: {
    data: History[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const LAST_HOUR = 1 * 60 * 60 * 1000;
const QUARTER_HOUR = 15 * 60 * 1000;

function quarterHourTicks(minTimestamp: number, maxTimestamp: number) {
  const firstTick = Math.ceil(minTimestamp / QUARTER_HOUR) * QUARTER_HOUR;
  const ticks: number[] = [];

  for (let tick = firstTick; tick <= maxTimestamp; tick += QUARTER_HOUR) {
    ticks.push(tick);
  }

  return ticks;
}

export default class WindDirectionGraph extends Component<WindDirectionGraphSignature> {
  @service declare intl: IntlService;

  get chartOptions() {
    const now = Date.now();
    const minTimestamp = now - LAST_HOUR;

    return {
      chart: {
        height: '100%',
        // Keep a tiny inset so the outer polar line does not clip against the card edge.
        spacing: [0, 0, 0, 0],
        type: 'scatter',
      },
      pane: {
        size: '100%',
      },
      yAxis: {
        min: minTimestamp,
        max: now,
        tickPositions: quarterHourTicks(minTimestamp, now),
      },
    };
  }

  get points() {
    if (this.args.data.length === 0) {
      return [];
    }

    return this.args.data.map((elm) => ({
      x: elm.direction,
      y: elm.timestamp,
      color: windToColour(elm.speed),
      customTooltip: `${this.intl.formatTime(elm.timestamp, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })} ${this.intl.formatNumber(elm.temperature, {
        format: 'temperature',
      })}`,
    }));
  }

  get chartData() {
    return [
      {
        connectEnds: false,
        name: 'Wind Direction',
        data: this.points,
        lineWidth: 1.5,
        marker: {
          radius: 3,
        },
      },
    ];
  }

  <template>
    <Polar
      class="h-full min-h-0 min-w-0 w-full [&_.chart-container]:h-full [&_.chart-container]:min-h-0 [&_.chart-container]:w-full"
      @chartData={{this.chartData}}
      @chartOptions={{this.chartOptions}}
    />
  </template>
}
