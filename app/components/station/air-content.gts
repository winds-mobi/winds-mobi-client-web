import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import TimeSeries from '../chart/time-series';
import type { History } from 'winds-mobi-client-web/services/store.js';
import { buildTimeSeriesData } from 'winds-mobi-client-web/utils/chart-series';

const TEMPERATURE_ZONES = [
  { color: '#c4b5fd', value: -10 },
  { color: '#7dd3fc', value: 0 },
  { color: '#1d4ed8', value: 10 },
  { color: '#16a34a', value: 20 },
  { color: '#eab308', value: 30 },
  { color: '#f97316', value: 40 },
  { color: '#dc2626' },
];

export interface StationAirContentSignature {
  Args: {
    history: History[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationAirContent extends Component<StationAirContentSignature> {
  @cached
  get chartData() {
    const temperature = buildTimeSeriesData(
      this.args.history,
      (elm) => elm.timestamp,
      (elm) => elm.temperature
    );
    const humidity = buildTimeSeriesData(
      this.args.history,
      (elm) => elm.timestamp,
      (elm) => elm.humidity
    );

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
        zones: TEMPERATURE_ZONES,
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
        {
          endOnTick: false,
          title: {
            text: null,
          },
          labels: {
            format: '{value:.0f}°C',
          },
          maxPadding: 0.04,
          minPadding: 0.02,
          opposite: false,
          softMin: 0,
          startOnTick: false,
          style: { color: 'red' },
          tickAmount: 5,
        },
        {
          endOnTick: false,
          title: {
            text: null,
          },
          labels: {
            format: '{value:.0f}%',
          },
          maxPadding: 0.04,
          minPadding: 0.02,
          softMin: 0,
          startOnTick: false,
          style: { color: 'skyblue' },
          tickAmount: 5,
          opposite: true,
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
