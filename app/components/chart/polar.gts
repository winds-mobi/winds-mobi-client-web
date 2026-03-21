/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
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
    credits: {
      enabled: false,
    },
    chart: {
      height: 240,
      polar: true,
      type: 'line',
      spacing: [0, 0, 0, 0],
    },
    title: {
      text: undefined,
    },
    legend: {
      enabled: false, // Disable the legend
    },
    xAxis: {
      tickInterval: 45,
      gridLineWidth: 0,
      min: 0,
      max: 360,
      labels: {
        formatter: function ({ value }: { value: number }) {
          return DIRECTIONS[Math.round(value / 45)];
        },
        distance: 0,
        style: {
          fontSize: '9px',
        },
      },
    },
    yAxis: {
      min: 0,
      max: 1, // Normalized radial distance (0 to 1)
      labels: {
        enabled: false,
      },
      // gridLineInterpolation: 'polygon',
      showLastLabel: false,
    },
    tooltip: {
      formatter: function (): string {
        return this.point.customTooltip;
      },
    },
    plotOptions: {
      series: {
        animation: {
          duration: 0, // Set duration to 0 to disable the initial animation
        },
        color: '#aaa',
        // marker: {
        //   enabled: false, // Disables markers for all series in this chart
        // },
        // states: {
        //   hover: {
        //     enabled: false, // Disables hover effect for all series in this chart
        //   },
        // },
        // colorByPoint: true, // Ensure each point gets its own color
      },
    },
  };

  get mergedChartOptions() {
    return {
      ...this.defaultChartOptions,
      ...this.args.chartOptions,
      chart: {
        ...this.defaultChartOptions.chart,
        ...this.args.chartOptions?.chart,
      },
      xAxis: {
        ...this.defaultChartOptions.xAxis,
        ...this.args.chartOptions?.xAxis,
      },
      yAxis: {
        ...this.defaultChartOptions.yAxis,
        ...this.args.chartOptions?.yAxis,
      },
      tooltip: {
        ...this.defaultChartOptions.tooltip,
        ...this.args.chartOptions?.tooltip,
      },
      plotOptions: {
        ...this.defaultChartOptions.plotOptions,
        ...this.args.chartOptions?.plotOptions,
      },
    };
  }

  <template>
    <HighCharts
      @content={{@chartData}}
      @chartOptions={{this.mergedChartOptions}}
    />
  </template>
}
