import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import TimeSeries from 'winds-mobi-client-web/components/chart/time-series';
import { windColourZones } from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { History } from 'winds-mobi-client-web/services/store.js';
import { buildTimeSeriesData } from 'winds-mobi-client-web/utils/chart-series';

export interface StationWindContentSignature {
  Args: {
    history: History[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationWindContent extends Component<StationWindContentSignature> {
  zones = windColourZones();

  @cached
  get chartData() {
    const speed = buildTimeSeriesData(
      this.args.history,
      (elm) => elm.timestamp,
      (elm) => elm.speed
    );
    const gusts = buildTimeSeriesData(
      this.args.history,
      (elm) => elm.timestamp,
      (elm) => elm.gusts
    );

    return [
      {
        name: 'Wind',
        data: speed,
        fillOpacity: 0.16,
        tooltip: {
          valueSuffix: 'km/h',
        },
        type: 'area',
        zoneAxis: 'y',
        zones: this.zones,
      },
      {
        name: 'Gusts',
        data: gusts,
        dashStyle: 'ShortDash',
        lineWidth: 2.5,
        tooltip: {
          valueSuffix: 'km/h',
        },
        zoneAxis: 'y',
        zones: this.zones,
      },
    ];
  }

  @cached
  get chartOptions() {
    return {
      yAxis: {
        endOnTick: false,
        title: {
          text: null,
        },
        labels: {
          format: '{value:.0f} km/h',
        },
        maxPadding: 0.04,
        minPadding: 0.02,
        opposite: false,
        softMin: 0,
        startOnTick: false,
        tickAmount: 5,
      },
    };
  }

  <template>
    <TimeSeries
      @chartOptions={{this.chartOptions}}
      @chartData={{this.chartData}}
    />
  </template>
}
