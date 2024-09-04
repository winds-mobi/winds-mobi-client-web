import Component from '@glimmer/component';
import TimeSeries from '../chart/time-series';

export interface StationWindsSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class StationWinds extends Component<StationWindsSignature> {
  get chartData() {
    const speed = this.args.history.map((elm) => [elm.id * 1000, elm.speed]);
    const gusts = this.args.history.map((elm) => [elm.id * 1000, elm.gusts]);
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
        // Primary Y-axis (left side)
        title: {
          text: null,
        },
        labels: {
          format: '{value:.0f} km/h',
        },
        opposite: false,
        style: { color: 'red' },
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
