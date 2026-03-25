import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { cached } from '@glimmer/tracking';
import HighCharts from 'ember-highcharts/components/high-charts';
import {
  mergeChartOptions,
  type ChartOptions,
} from 'winds-mobi-client-web/utils/highcharts-options';
import {
  sortByNumericValue,
  type TimeSeriesPoint,
} from 'winds-mobi-client-web/utils/chart-series';
import type TimeSeriesSyncService from 'winds-mobi-client-web/services/time-series-sync';

interface TimeSeriesChartOptions extends ChartOptions {
  chart?: ChartOptions;
  plotOptions?: ChartOptions;
  tooltip?: ChartOptions;
  xAxis?: ChartOptions;
}

interface SyncChart {
  redraw(): void;
  xAxis: Array<{
    chart: SyncChart;
  }>;
}

interface SetExtremesEvent {
  max?: number;
  min?: number;
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
      selected: 4,
    },
    title: {
      text: undefined,
    },
    xAxis: {
      type: 'datetime',
      gridLineWidth: 1,
      crosshair: true,
      labels: {
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
  };

  @cached
  get mergedChartOptions() {
    const mergedOptions = mergeChartOptions(
      this.defaultChartOptions,
      this.args.chartOptions,
      ['chart', 'xAxis', 'tooltip', 'plotOptions']
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

  @cached
  get sortedChartData() {
    return this.args.chartData?.map((series) => ({
      ...series,
      data: sortByNumericValue(series.data, (point) => point[0]),
    }));
  }

  @action
  handleChartCreated(chart: SyncChart) {
    if (this.chart && this.chart !== chart) {
      this.timeSeriesSync.unregisterChart(this.chart);
    }

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
      @content={{this.sortedChartData}}
      @chartOptions={{this.mergedChartOptions}}
      @callback={{this.handleChartCreated}}
    />
  </template>
}
