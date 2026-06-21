import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import HighCharts from 'ember-highcharts/components/high-charts';
import {
  mergeChartOptions,
  type ChartOptions,
} from 'winds-mobi-client-web/utils/highcharts-options';
import { type TimeSeriesPoint } from 'winds-mobi-client-web/utils/chart-series';

interface TimeSeriesChartOptions extends ChartOptions {
  chart?: ChartOptions;
  plotOptions?: ChartOptions;
  responsive?: ChartOptions;
  rangeSelector?: ChartOptions;
  tooltip?: ChartOptions;
  xAxis?: ChartOptions;
}

export interface TimeSeriesSignature {
  Args: {
    chartOptions?: TimeSeriesChartOptions;
    chartData?: TimeSeriesSeries[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

interface TimeSeriesSeries extends ChartOptions {
  data: TimeSeriesPoint[];
}

export default class TimeSeries extends Component<TimeSeriesSignature> {
  defaultChartOptions: TimeSeriesChartOptions = {
    credits: {
      enabled: false,
    },
    chart: {
      height: 272,
      reflow: true,
      spacingLeft: 0,
      spacingRight: 0,
      type: 'spline',
      panning: {
        enabled: true,
        type: 'x',
      },
      spacingBottom: 6,
      spacingTop: 6,
      zoomType: 'x',
    },
    rangeSelector: {
      inputEnabled: false,
      buttons: [
        {
          type: 'day',
          count: 5,
          text: '5d',
        },
        {
          type: 'day',
          count: 2,
          text: '2d',
        },
        {
          type: 'day',
          count: 1,
          text: '1d',
        },
        {
          type: 'hour',
          count: 12,
          text: '12h',
        },
        {
          type: 'hour',
          count: 6,
          text: '6h',
        },
      ],
      buttonSpacing: 4,
      buttonTheme: {
        height: 24,
        padding: 3,
        r: 6,
        style: {
          fontSize: '12px',
          fontWeight: '600',
        },
      },
      selected: 4,
      labelStyle: {
        fontSize: '12px',
      },
    },
    title: {
      text: undefined,
    },
    xAxis: {
      type: 'datetime',
      gridLineWidth: 1,
      crosshair: true,
      labels: {
        style: {
          fontSize: '12px',
          lineHeight: '14px',
        },
        useHTML: true,
        formatter: function (this: {
          chart: {
            time: { dateFormat: (format: string, timestamp: number) => string };
          };
          value: number;
        }) {
          return `${this.chart.time.dateFormat(
            '%H:%M',
            this.value
          )}<br/>${this.chart.time.dateFormat('%a', this.value)}`;
        },
      },
    },
    legend: {
      enabled: false,
    },
    navigator: {
      enabled: false,
    },
    scrollbar: {
      enabled: true,
    },
    plotOptions: {
      series: {
        animation: {
          duration: 0,
        },
      },
    },
    tooltip: {
      xDateFormat: '%e %b %H:%M',
      shared: true,
      crosshairs: true,
      outside: true,
      valueDecimals: 0,
    },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 420,
          },
          chartOptions: {
            xAxis: {
              labels: {
                style: {
                  fontSize: '11px',
                  lineHeight: '13px',
                },
              },
            },
          },
        },
        {
          condition: {
            maxWidth: 360,
          },
          chartOptions: {
            xAxis: {
              labels: {
                style: {
                  fontSize: '10px',
                  lineHeight: '12px',
                },
              },
            },
          },
        },
      ],
    },
  };

  @cached
  get mergedChartOptions() {
    return mergeChartOptions(this.defaultChartOptions, this.args.chartOptions, [
      'chart',
      'xAxis',
      'tooltip',
      'plotOptions',
      'rangeSelector',
      'responsive',
    ]);
  }

  <template>
    <HighCharts
      @mode="StockChart"
      @content={{@chartData}}
      @chartOptions={{this.mergedChartOptions}}
    />
  </template>
}
