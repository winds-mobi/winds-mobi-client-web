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
        distance: '86%',
        style: {
          fontSize: '11px',
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
            maxWidth: 199,
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
                distance: '78%',
                style: {
                  fontSize: '10px',
                },
              },
            },
          },
        },
        {
          // Thumbnail size (e.g. a compact nearby-list row): the N/E/S/W
          // labels have no room to render legibly, so drop them entirely and
          // let the polar pane fill almost the whole box as a plain dot scatter.
          condition: {
            maxWidth: 90,
          },
          chartOptions: {
            pane: {
              size: '98%',
            },
            plotOptions: {
              series: {
                lineWidth: 1,
                marker: {
                  radius: 2,
                },
              },
            },
            xAxis: {
              labels: {
                enabled: false,
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
