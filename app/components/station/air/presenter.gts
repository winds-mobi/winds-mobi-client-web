import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import TimeSeries from '../../chart/time-series';
import { temperatureColourZones } from 'winds-mobi-client-web/helpers/temperature-to-colour';
import type { History } from 'winds-mobi-client-web/services/store.js';
import {
  defaultYAxis,
  seriesFor,
} from 'winds-mobi-client-web/utils/highcharts-options';

export interface StationAirContentSignature {
  Args: {
    history: History[];
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationAirContent extends Component<StationAirContentSignature> {
  @cached
  get chartData() {
    const temperature = seriesFor(this.args.history, 'temperature');
    const humidity = seriesFor(this.args.history, 'humidity');

    return [
      {
        name: 'Temperature',
        data: temperature,
        marker: {
          symbol:
            'url(data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 16 16%22%3E%3Ctext x=%220%22 y=%2212%22 font-size=%2216%22%3E☀️%3C/text%3E%3C/svg%3E)',
        },
        tooltip: {
          valueSuffix: '°C',
        },
        zoneAxis: 'y',
        zones: temperatureColourZones(),
      },
      {
        name: 'Humidity',
        data: humidity,
        yAxis: 1,
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'skyblue'],
            [1, 'grey'],
          ],
        },
        marker: {
          symbol:
            'url(data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 16 16%22%3E%3Ctext x=%220%22 y=%2212%22 font-size=%2216%22%3E💧%3C/text%3E%3C/svg%3E)',
        },
        tooltip: {
          valueSuffix: '%',
        },
      },
    ];
  }

  @cached
  get chartOptions() {
    return {
      yAxis: [
        defaultYAxis({
          labels: { format: '{value:.0f}°C' },
          style: { color: 'red' },
        }),
        defaultYAxis({
          labels: { format: '{value:.0f}%' },
          opposite: true,
          style: { color: 'skyblue' },
        }),
      ],
    };
  }

  <template>
    <TimeSeries
      @stationId={{@stationId}}
      @chartData={{this.chartData}}
      @chartOptions={{this.chartOptions}}
    />
  </template>
}
