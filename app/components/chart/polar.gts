import Component from '@glimmer/component';
import HighCharts from 'ember-highcharts/components/high-charts';
import { DIRECTIONS } from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';

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
      text: undefined,
    },
    legend: {
      enabled: false, // Disable the legend
    },
    xAxis: {
      tickInterval: 45,
      min: 0,
      max: 360,
      labels: {
        formatter: function ({ value }: { value: number }) {
          return DIRECTIONS[Math.round(value / 45)];
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
      formatter: function (): string {
        return '<b>Direction: </b>' + this.x + '°';
      },
    },
    plotOptions: {
      series: {
        animation: {
          duration: 0, // Set duration to 0 to disable the initial animation
        },
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
