import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import TimeSeries from '../chart/time-series';
import { t } from 'ember-intl';
import StationSectionCard from './section-card';
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

export interface StationAirSignature {
  Args: {
    history: History[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationAir extends Component<StationAirSignature> {
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
            'url(data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 16 16%22%3E%3Ctext x=%220%22 y=%2212%22 font-size=%2216%22%3E☀️%3C/text%3E%3C/svg%3E)', // Sun emoji
        },
        tooltip: {
          valueSuffix: '°C', // Add degrees Celsius to the tooltip
        },
        zoneAxis: 'y',
        zones: TEMPERATURE_ZONES,
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

  @cached
  get chartOptions() {
    return {
      yAxis: [
        {
          // Primary Y-axis (left side)
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
          // Secondary Y-axis (right side)
          endOnTick: false,
          title: {
            text: null,
          },
          labels: {
            format: '{value:.0f}%', // Format labels as percentages
          },
          maxPadding: 0.04,
          minPadding: 0.02,
          softMin: 0,
          startOnTick: false,
          style: { color: 'skyblue' },
          tickAmount: 5,
          opposite: true, // Position this Y-axis on the right side
        },
      ],
    };
  }

  <template>
    <section data-test-station-air-section>
      <StationSectionCard @title={{t "station.air"}} @contentClass="mt-2">
        <TimeSeries
          @chartData={{this.chartData}}
          @chartOptions={{this.chartOptions}}
        />
      </StationSectionCard>
    </section>
  </template>
}
