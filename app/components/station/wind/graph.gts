import Component from '@glimmer/component';
import TimeSeries from 'winds-mobi-client-web/components/chart/time-series';
import type { History } from 'winds-mobi-client-web/services/store.js';

export interface StationWindsGraphSignature {
  Args: {
    data: History[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationWindsGraph extends Component<StationWindsGraphSignature> {
  get chartData() {
    const speed = this.args.data.map((elm) => [elm.timestamp, elm.speed]);
    const gusts = this.args.data.map((elm) => [elm.timestamp, elm.gusts]);
    return [
      {
        name: 'Wind',
        data: speed,
        tooltip: {
          valueSuffix: 'km/h', // Add degrees Celsius to the tooltip
        },
        color: '#DAA520',
        fillColor: 'rgba(230, 230, 230, 0.4)',
        type: 'area', // Area chart for the second dataset
      },
      {
        name: 'Gusts',
        data: gusts,
        tooltip: {
          valueSuffix: 'km/h', // Add degrees Celsius to the tooltip
        },
        color: '#DAA520',
      },
    ];
  }

  get chartOptions() {
    return {
      yAxis: {
        title: {
          text: null,
        },
        labels: {
          format: '{value:.0f} km/h',
        },
        opposite: false,
      },
    };
  }

  <template>
    <TimeSeries
      @chartOptions={{this.chartOptions}}
      @chartData={{this.chartData}}
    />
  </template>
}
