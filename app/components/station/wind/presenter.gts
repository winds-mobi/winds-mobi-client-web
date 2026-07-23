import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import TimeSeries from 'winds-mobi-client-web/components/chart/time-series';
import { windColourZones } from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { History } from 'winds-mobi-client-web/services/store.js';
import {
  defaultYAxis,
  seriesFor,
} from 'winds-mobi-client-web/utils/highcharts-options';

export interface StationWindContentSignature {
  Args: {
    history: History[];
    stationId: string;
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
    const speed = seriesFor(this.args.history, 'speed');
    const gusts = seriesFor(this.args.history, 'gusts');

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
        dataGrouping: {
          approximation: 'high',
        },
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
      yAxis: defaultYAxis({ labels: { format: '{value:.0f} km/h' } }),
    };
  }

  <template>
    <TimeSeries
      @stationId={{@stationId}}
      @chartOptions={{this.chartOptions}}
      @chartData={{this.chartData}}
    />
  </template>
}
