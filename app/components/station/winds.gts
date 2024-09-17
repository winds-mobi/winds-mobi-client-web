import Component from '@glimmer/component';
import TimeSeries from '../chart/time-series';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import type { History } from 'winds-mobi-client-web/services/store.js';
import { inject as service } from '@ember/service';
import { Request } from '@warp-drive/ember';
import type StoreService from 'winds-mobi-client-web/services/store.js';

export interface StationWindsSignature {
  Args: {
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationWinds extends Component<StationWindsSignature> {
  @service declare store: StoreService;

  get historyRequest() {
    const options = historyQuery<History>('history', this.args.stationId);
    return this.store.request(options);
  }

  dataToChart(historyData: History[]) {
    const speed = historyData.map((elm) => [elm.timestamp, elm.speed]);
    const gusts = historyData.map((elm) => [elm.timestamp, elm.gusts]);
    return [
      {
        name: 'Wind',
        data: speed,
        tooltip: {
          valueSuffix: 'km/h', // Add degrees Celsius to the tooltip
        },
        color: '#DAA520',
        fillColor: 'rgba(230, 230, 230, 0.4)',
        type: 'area', // Area chart for the second dataset
      },
      {
        name: 'Gusts',
        data: gusts,
        tooltip: {
          valueSuffix: 'km/h', // Add degrees Celsius to the tooltip
        },
        color: '#DAA520',
      },
    ];
  }

  get chartOptions() {
    return {
      yAxis: {
        // Primary Y-axis (left side)
        title: {
          text: null,
        },
        labels: {
          format: '{value:.0f} km/h',
        },
        opposite: false,
        style: { color: 'red' },
      },
    };
  }

  <template>
    <Request @request={{this.historyRequest}}>
      <:content as |historyResult state|>
        {{#let (this.dataToChart historyResult.data) as |chartData|}}
          <TimeSeries
            @chartOptions={{this.chartOptions}}
            @chartData={{chartData}}
          />
        {{/let}}
      </:content>
    </Request>
  </template>
}
