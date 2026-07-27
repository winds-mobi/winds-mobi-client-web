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
        yAxis: 1,
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
        yAxis: 1,
        zoneAxis: 'y',
        zones: this.zones,
      },
      {
        name: 'Direction',
        data: direction,
        type: 'windbarb',
        yAxis: 0,
        tooltip: {
          pointFormat: '{series.name}: {point.customTooltip}<br/>',
        },
      },
    ];
  }

  @cached
  get chartOptions() {
    return {
      // Two panes, not one: the Direction series gets its own axis (index
      // 0) pinned to a strip along the top of the chart, so the arrows read
      // as a row above the graph rather than overlapping the Wind/Gusts
      // lines. windbarb doesn't plot a real value against this axis (see
      // buildWindbarbData -- its `value` drives the barb's own shape, not a
      // y-position); it only anchors to the axis's own pixel band, so this
      // axis needs no visible scale of its own. The Wind/Gusts axis (index
      // 1, what `defaultYAxis` already returns) moves into the remaining
      // space below it.
      yAxis: [
        {
          top: '0%',
          height: '18%',
          gridLineWidth: 0,
          title: { text: null },
          labels: { enabled: false },
        },
        {
          ...defaultYAxis({ labels: { format: '{value:.0f} km/h' } }),
          top: '25%',
          height: '75%',
          offset: 0,
        },
      ],
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
