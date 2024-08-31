import Component from '@glimmer/component';
import HighCharts from 'ember-highcharts/components/high-charts';

export interface StationAirSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationAir extends Component<StationAirSignature> {
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
      yAxis: [
        {
          // Primary Y-axis
          title: {
            text: 'Temperature (°C)',
          },
          labels: {
            format: '{value}°C',
          },
        },
        {
          // Secondary Y-axis
          title: {
            text: 'Humidity (%)',
          },
          labels: {
            format: '{value}%',
          },
          opposite: true, // Display this Y-axis on the right side
        },
      ],
      tooltip: {
        shared: true, // Shows the values for all series on hover
        crosshairs: true, // Draws a vertical line across the chart
      },
    };
  }

  get chartData() {
    const temperature = this.args.history.map((elm) => [
      elm.id * 1000,
      elm.temperature,
    ]);
    const humidity = this.args.history.map((elm) => [
      elm.id * 1000,
      elm.humidity,
    ]);
    return [
      {
        name: 'Temperature',
        data: temperature,
      },
      {
        name: 'Humidity',
        data: humidity,
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
