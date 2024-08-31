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
      chart: { height: 300 },
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
          text: 'km/h',
        },
      },
      tooltip: {
        shared: true, // Shows the values for all series on hover
        crosshairs: true, // Draws a vertical line across the chart
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
