import Component from '@glimmer/component';
import HighCharts from 'ember-highcharts/components/high-charts';
import {
  mergeChartOptions,
  type ChartOptions,
} from 'winds-mobi-client-web/utils/highcharts-options';

interface TimeSeriesChartOptions extends ChartOptions {
  chart?: ChartOptions;
  plotOptions?: ChartOptions;
  tooltip?: ChartOptions;
  xAxis?: ChartOptions;
}

export interface TimeSeriesSignature {
  Args: {
    chartOptions?: TimeSeriesChartOptions;
    chartData?: unknown;
  };
  Blocks: {
    default: [];
  };
  Element: null;
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
      enabled: true,
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
        format: '{value:%a %H:%M}',
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

  get mergedChartOptions() {
    return mergeChartOptions(this.defaultChartOptions, this.args.chartOptions, [
      'chart',
      'xAxis',
      'tooltip',
      'plotOptions',
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
