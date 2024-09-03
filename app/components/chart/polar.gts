import Component from '@glimmer/component';
import HighCharts from 'ember-highcharts/components/high-charts';

export interface PolarSignature {
  Args: {
    chartOptions: any;
    chartData?: any;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class Polar extends Component<PolarSignature> {
  defaultChartOptions = {
    chart: {
      polar: true,
      type: 'line',
    },
    title: {
      text: 'Wind Direction',
    },
    pane: {
      size: '80%',
    },
    xAxis: {
      tickInterval: 45,
      min: 0,
      max: 360,
      labels: {
        formatter: function (value) {
          var directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
          return directions[Math.round(value / 45)];
        },
      },
    },
    yAxis: {
      min: 0,
      max: 1, // Normalized radial distance (0 to 1)
      labels: {
        enabled: false,
      },
      gridLineInterpolation: 'polygon',
      showLastLabel: false,
    },
    tooltip: {
      formatter: function (value) {
        return '<b>Direction: </b>' + value + '°';
      },
    },
  };

  get mergedChartOptions() {
    return {
      ...this.defaultChartOptions,
      ...this.args.chartOptions,
    };
  }

  <template>
    <HighCharts
      @content={{this.args.chartData}}
      @chartOptions={{this.mergedChartOptions}}
    />
  </template>
}
