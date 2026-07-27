import Component from '@glimmer/component';
import { service } from '@ember/service';
import { cached } from '@glimmer/tracking';
import type { IntlService } from 'ember-intl';
import TimeSeries from 'winds-mobi-client-web/components/chart/time-series';
import { windColourZones } from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { History } from 'winds-mobi-client-web/services/store.js';
import {
  defaultYAxis,
  seriesFor,
  windbarbSeriesFor,
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
  @service declare intl: IntlService;

  zones = windColourZones();

  @cached
  get chartData() {
    const speed = seriesFor(this.args.history, 'speed');
    const gusts = seriesFor(this.args.history, 'gusts');
    const direction = windbarbSeriesFor(this.args.history, this.intl);

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
      {
        name: 'Direction',
        data: direction,
        type: 'windbarb',
        tooltip: {
          pointFormat: '{series.name}: {point.customTooltip}<br/>',
        },
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
      @needsWindbarb={{true}}
    />
  </template>
}
