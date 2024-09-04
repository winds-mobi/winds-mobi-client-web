import Component from '@glimmer/component';
import TimeSeries from '../chart/time-series';

export interface StationAirSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationAir extends Component<StationAirSignature> {
  get chartData() {
    const temperature = this.args.history.map((elm) => [
      elm.timestamp,
      elm.temperature,
    ]);
    const humidity = this.args.history.map((elm) => [
      elm.timestamp,
      elm.humidity,
    ]);

    return [
      {
        name: 'Temperature',
        data: temperature,
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'red'], // Color at 30°C
            [1, 'blue'], // Color at 0°C
          ],
        },
        marker: {
          symbol:
            'url(data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 16 16%22%3E%3Ctext x=%220%22 y=%2212%22 font-size=%2216%22%3E☀️%3C/text%3E%3C/svg%3E)', // Sun emoji
        },
        tooltip: {
          valueSuffix: '°C', // Add degrees Celsius to the tooltip
        },
      },
      {
        name: 'Humidity',
        data: humidity,
        yAxis: 1, // Associate this series with the second Y-axis (right side)
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'skyblue'], // Color at 30°C
            [1, 'grey'], // Color at 0°C
          ],
        },
        marker: {
          symbol:
            'url(data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 16 16%22%3E%3Ctext x=%220%22 y=%2212%22 font-size=%2216%22%3E💧%3C/text%3E%3C/svg%3E)', // Water drop emoji
        },
        tooltip: {
          valueSuffix: '%', // Add percentage sign to the tooltip
        },
      },
    ];
  }

  get chartOptions() {
    return {
      yAxis: [
        {
          // Primary Y-axis (left side)
          title: {
            text: null,
          },
          labels: {
            format: '{value:.0f}°C',
          },
          opposite: false,
          style: { color: 'red' },
        },
        {
          // Secondary Y-axis (right side)
          title: {
            text: null,
          },
          labels: {
            format: '{value:.0f}%', // Format labels as percentages
          },
          style: { color: 'skyblue' },
          opposite: true, // Position this Y-axis on the right side
        },
      ],
    };
  }

  <template>
    <TimeSeries
      @chartData={{this.chartData}}
      @chartOptions={{this.chartOptions}}
    />
  </template>
}
