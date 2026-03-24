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

const DURATION = 1 * 60 * 60;

export default class WindDirectionGraph extends Component<WindDirectionGraphSignature> {
  @service declare intl: IntlService;

  chartOptions = {
    chart: {
      height: null,
      margin: [0, 0, 0, 0],
    },
    pane: {
      size: '100%',
    },
  };

  get points() {
    if (this.args.data.length === 0) {
      return [];
    }

    const latestTimestamp = this.args.data[this.args.data.length - 1]!.timestamp;

    return this.args.data.map((elm) => ({
      x: elm.direction,
      y: 1 - (latestTimestamp - elm.timestamp) / (DURATION * 1000),
      color: windToColour(elm.speed),
      customTooltip: this.intl.formatTime(elm.timestamp, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }),
    }));
  }

  get chartData() {
    return [
      {
        name: 'Wind Direction',
        data: this.points,
        connectEnds: false,
      },
    ];
  }

  get hasChartData() {
    return this.points.length > 0;
  }

  <template>
    {{#if this.hasChartData}}
      <Polar
        class="h-full w-full [&_.chart-container]:h-full [&_.chart-container]:w-full"
        @chartData={{this.chartData}}
        @chartOptions={{this.chartOptions}}
      />
    {{/if}}
  </template>
}
