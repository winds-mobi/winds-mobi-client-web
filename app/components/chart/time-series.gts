import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { cached } from '@glimmer/tracking';
import HighCharts from 'ember-highcharts/components/high-charts';
import {
  mergeChartOptions,
  type ChartOptions,
} from 'winds-mobi-client-web/utils/highcharts-options';
import { type TimeSeriesPoint } from 'winds-mobi-client-web/utils/chart-series';
import type TimeSeriesSyncService from 'winds-mobi-client-web/services/time-series-sync';
import type { SyncChart } from 'winds-mobi-client-web/services/time-series-sync';

interface TimeSeriesChartOptions extends ChartOptions {
  chart?: ChartOptions;
  plotOptions?: ChartOptions;
  responsive?: ChartOptions;
  rangeSelector?: ChartOptions;
  tooltip?: ChartOptions;
  xAxis?: ChartOptions;
}

interface SetExtremesEvent {
  max: number;
  min: number;
  trigger?: string;
  target: {
    chart: SyncChart;
  };
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
  @service declare timeSeriesSync: TimeSeriesSyncService;

  private chart?: SyncChart;

  defaultChartOptions: TimeSeriesChartOptions = {
    credits: {
      enabled: false,
    },
    chart: {
      height: 272,
      reflow: true,
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
        height: 22,
        padding: 2,
        r: 6,
        style: {
          fontSize: '10px',
          fontWeight: '600',
        },
      },
      selected: 4,
      labelStyle: {
        fontSize: '10px',
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
          fontSize: '10px',
          lineHeight: '12px',
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
            chart: {
              height: 244,
            },
            rangeSelector: {
              buttonSpacing: 2,
              buttonTheme: {
                height: 20,
                padding: 1,
                width: 28,
                style: {
                  fontSize: '9px',
                  fontWeight: '600',
                },
              },
              labelStyle: {
                fontSize: '9px',
              },
            },
            xAxis: {
              labels: {
                style: {
                  fontSize: '9px',
                  lineHeight: '11px',
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
            chart: {
              height: 224,
            },
            rangeSelector: {
              buttonTheme: {
                height: 18,
                padding: 1,
                width: 24,
                style: {
                  fontSize: '8px',
                  fontWeight: '600',
                },
              },
              labelStyle: {
                fontSize: '8px',
              },
            },
            xAxis: {
              labels: {
                style: {
                  fontSize: '8px',
                  lineHeight: '10px',
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
    const mergedOptions = mergeChartOptions(
      this.defaultChartOptions,
      this.args.chartOptions,
      [
        'chart',
        'xAxis',
        'tooltip',
        'plotOptions',
        'rangeSelector',
        'responsive',
      ]
    );

    return mergeChartOptions(
      mergedOptions,
      {
        xAxis: {
          events: {
            afterSetExtremes: this.handleAfterSetExtremes,
          },
        },
      },
      ['xAxis']
    );
  }

  @action
  handleChartCreated(chart: SyncChart) {
    this.chart = chart;
    this.timeSeriesSync.registerChart(chart);
  }

  @action
  handleAfterSetExtremes(event: SetExtremesEvent) {
    this.timeSeriesSync.syncRange(
      event.target.chart,
      event.min,
      event.max,
      event.trigger
    );
  }

  willDestroy() {
    super.willDestroy();

    if (this.chart) {
      this.timeSeriesSync.unregisterChart(this.chart);
    }
  }

  <template>
    <HighCharts
      @mode="StockChart"
      @content={{@chartData}}
      @chartOptions={{this.mergedChartOptions}}
      @callback={{this.handleChartCreated}}
    />
  </template>
}
