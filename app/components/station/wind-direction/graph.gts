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
    },
  };

  get chartData() {
    const now = Date.now();

    return [
      {
        name: 'Wind Direction',
        data: this.args.data.map((elm) => ({
          x: elm.direction,
          y: 1 - (now - elm.timestamp) / (DURATION * 1000),
          color: windToColour(elm.speed),
          customTooltip: this.intl.formatTime(elm.timestamp, {
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
          }),
        })),
        connectEnds: false,
      },
    ];
  }

  <template>
    <Polar
      class="h-full [&_.chart-container]:h-full"
      @chartData={{this.chartData}}
      @chartOptions={{this.chartOptions}}
    />
  </template>
}
