import Component from '@glimmer/component';
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

interface TimeSeriesChartOptions extends ChartOptions {
  chart?: ChartOptions;
  plotOptions?: ChartOptions;
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
    },
  };

  @cached
  get mergedChartOptions() {
    return mergeChartOptions(this.defaultChartOptions, this.args.chartOptions, [
      'chart',
      'xAxis',
      'tooltip',
      'plotOptions',
    ]);
  }

  @cached
  get sortedChartData() {
    return this.args.chartData?.map((series) => ({
      ...series,
      data: sortByNumericValue(series.data, (point) => point[0]),
    }));
  }

  <template>
    <HighCharts
      @mode="StockChart"
      @content={{this.sortedChartData}}
      @chartOptions={{this.mergedChartOptions}}
    />
  </template>
}
