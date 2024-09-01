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
      chart: {
        height: 300,
        zooming: {
          type: 'x',
        },
        type: 'spline', // Use 'spline' for smoother lines
        panning: true, // Enable panning
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
        // categories: this.args.history.map((elm) => Number.parseInt(elm.id)),
        type: 'datetime',
        // tickInterval: 3600 * 1000, // Set tick interval to 1 hour (3600 seconds * 1000 milliseconds)
        gridLineWidth: 1, // Enable grid lines
        // dateTimeLabelFormats: {
        // hour: '%H:%M', // Format labels as hours and minutes
        // minute: '%H:%M', // Format labels as hours and minutes
        // },
        crosshair: true, // Adds the vertical line on hover
        // min: Date.now() - 100 * 60 * 60 * 1000, // 6 hours ago from now
        // max: Date.now(), // Current time
        scrollbar: {
          enabled: false, // Enable the scrollbar for additional navigation
        },
        // min: 0,
        // max: 100,

        min: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago in milliseconds
        max: Date.now(), // Current time in milliseconds
      },
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
      legend: {
        enabled: false, // Disable the legend
      },
      navigator: {
        enabled: false,
        // scrollbar: {
        // enabled: false, // Disable the scrollbar in the navigator
        // },
      },
      plotOptions: {
        series: {
          animation: {
            // Disable animation for the initial render only
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
  }

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
        color: 'red', // Set the color of the temperature line to red
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
        color: 'skyblue', // Set the color of the humidity line to light blue
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

  <template>
    <HighCharts
      @mode='StockChart'
      @content={{this.chartData}}
      @chartOptions={{this.chartOptions}}
    />
  </template>
}
