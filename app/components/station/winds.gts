import Component from '@glimmer/component';
import HighCharts from 'ember-highcharts/components/high-charts';

export interface StationWindsSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class StationWinds extends Component<StationWindsSignature> {
  get chartOptions() {
    return {
      chart: {
        height: 300,
        type: 'spline', // Use 'spline' for smoother lines
      },
      title: {
        text: undefined,
      },
      xAxis: {
        // categories: this.args.history.map((elm) => Number.parseInt(elm.id)),
        type: 'datetime',
        dateTimeLabelFormats: {
          hour: '%H:%M', // Format labels as hours and minutes
          minute: '%H:%M', // Format labels as hours and minutes
        },

        crosshair: true, // Adds the vertical line on hover
      },
      yAxis: {
        title: {
          text: null,
        },
        labels: {
          format: '{value} km/h', // Format labels as percentages
        },
      },
      tooltip: {
        xDateFormat: '%e %b %H:%M', // Custom format: "24 Dec 21:20"
        shared: true, // Shows the values for all series on hover
        crosshairs: true, // Draws a vertical line across the chart
      },
      legend: {
        enabled: false, // Disable the legend
      },
    };
  }

  get chartData() {
    const speed = this.args.history.map((elm) => [elm.id * 1000, elm.speed]);
    const gusts = this.args.history.map((elm) => [elm.id * 1000, elm.gusts]);
    return [
      {
        name: 'Wind',
        data: speed,
      },
      {
        name: 'Gusts',
        data: gusts,
      },
    ];
  }

  <template>
    <HighCharts
      @content={{this.chartData}}
      @chartOptions={{this.chartOptions}}
    />
  </template>
}
