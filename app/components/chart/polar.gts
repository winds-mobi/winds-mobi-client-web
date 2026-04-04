import Component from '@glimmer/component';
import HighCharts from 'ember-highcharts/components/high-charts';

import { DIRECTIONS } from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import {
  mergeChartOptions,
  type ChartOptions,
} from 'winds-mobi-client-web/utils/highcharts-options';

interface PolarChartOptions extends ChartOptions {
  chart?: ChartOptions;
  pane?: ChartOptions;
  plotOptions?: ChartOptions;
  responsive?: ChartOptions;
  tooltip?: ChartOptions;
  xAxis?: ChartOptions;
  yAxis?: ChartOptions;
}

export interface PolarSignature {
  Args: {
    chartOptions?: PolarChartOptions;
    chartData?: unknown;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class Polar extends Component<PolarSignature> {
  defaultChartOptions: PolarChartOptions = {
    credits: {
      enabled: false,
    },
    chart: {
      polar: true,
      reflow: true,
      type: 'line',
      spacing: [0, 0, 0, 0],
    },
    title: {
      text: undefined,
    },
    legend: {
      enabled: false,
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
        distance: '76%',
        style: {
          fontSize: '9px',
        },
      },
    },
    yAxis: {
      min: 0,
      max: 1,
      labels: {
        enabled: false,
      },
      showLastLabel: false,
    },
    tooltip: {
      formatter: function (this: { point: { customTooltip: string } }) {
        return this.point.customTooltip;
      },
    },
    plotOptions: {
      series: {
        animation: {
          duration: 0,
        },
        color: '#aaa',
      },
    },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 320,
          },
          chartOptions: {
            pane: {
              size: '95%',
            },
            xAxis: {
              labels: {
                distance: '72%',
                style: {
                  fontSize: '8px',
                },
              },
            },
          },
        },
        {
          condition: {
            maxWidth: 260,
          },
          chartOptions: {
            pane: {
              size: '92%',
            },
            plotOptions: {
              series: {
                lineWidth: 1.25,
                marker: {
                  radius: 2.5,
                },
              },
            },
            xAxis: {
              labels: {
                distance: '68%',
                style: {
                  fontSize: '7px',
                },
              },
            },
          },
        },
      ],
    },
  };

  get mergedChartOptions() {
    return mergeChartOptions(this.defaultChartOptions, this.args.chartOptions, [
      'chart',
      'xAxis',
      'yAxis',
      'tooltip',
      'pane',
      'plotOptions',
      'responsive',
    ]);
  }

  <template>
    <HighCharts
      ...attributes
      @content={{@chartData}}
      @chartOptions={{this.mergedChartOptions}}
    />
  </template>
}
