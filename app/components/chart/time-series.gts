import Component from '@glimmer/component';
import HighCharts from 'ember-highcharts/components/high-charts';

export interface TimeSeriesSignature {
  Args: {
    chartOptions: any;
    chartData?: any;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class TimeSeries extends Component<TimeSeriesSignature> {
  defaultChartOptions = {
    credits: {
      enabled: false,
    },
    chart: {
      height: 350,
      type: 'spline', // Use 'spline' for smoother lines
      panning: {
        enabled: true, // Enable panning
        type: 'x', // Allow panning on the x-axis (or set to 'y' or 'xy')
      },
      zoomType: 'x', // Allow zooming on x-axis (needed for panning)
    },
    rangeSelector: {
      enabled: true, // Enable the range selector
      inputEnabled: false, // Disable the date span input boxes
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
      selected: 4, // Default selected button index (e.g., 0 for '6h')
    },
    title: {
      text: undefined,
    },
    xAxis: {
      type: 'datetime',
      gridLineWidth: 1, // Enable grid lines
      crosshair: true, // Adds the vertical line on hover
      labels: {
        format: '{value:%H:%M}<br>{value:%a}', // Format to show hour:minute, day of week
      },
    },
    legend: {
      enabled: false, // Disable the legend
    },
    navigator: {
      enabled: false,
    },
    plotOptions: {
      series: {
        animation: {
          duration: 0, // Set duration to 0 to disable the initial animation
        },
      },
    },
    tooltip: {
      xDateFormat: '%e %b %H:%M', // Custom format: "24 Dec 21:20"
      shared: true, // Shows the values for all series on hover
      crosshairs: true, // Draws a vertical line across the chart
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
      @mode='StockChart'
      @content={{this.args.chartData}}
      @chartOptions={{this.mergedChartOptions}}
    />
  </template>
}
