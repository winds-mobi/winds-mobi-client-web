import Component from '@glimmer/component';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import type { History } from 'winds-mobi-client-web/services/store.js';
import { inject as service } from '@ember/service';
import { Request } from '@warp-drive/ember';
import type StoreService from 'winds-mobi-client-web/services/store.js';
import windToColour from '../../helpers/wind-to-colour';
import Polar from '../chart/polar';
import { type IntlService } from 'ember-intl';
import { action } from '@ember/object';

export interface WindDirectionSignature {
  Args: {
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const DURATION = 1 * 60 * 60;

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class WindDirection extends Component<WindDirectionSignature> {
  @service declare store: StoreService;
  @service declare intl: IntlService;

  get historyRequest() {
    const options = historyQuery<History>('history', this.args.stationId, {
      duration: DURATION,
    });
    return this.store.request(options);
  }

  // We need @action here to be able to reach this.intl
  @action
  dataToChart(historyData: History[]) {
    const now = Date.now();
    console.log();
    return [
      {
        name: 'Wind Direction',
        data: historyData.map((elm) => ({
          x: elm.direction,
          y: 1 - (now - elm.timestamp) / (DURATION * 1000),
          color: windToColour(elm.speed),
          customTooltip: this.intl.formatTime(elm.timestamp, {
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
          }),
        })),
        connectEnds: false,
      },
    ];
  }

  <template>
    <Request @request={{this.historyRequest}}>
      <:content as |historyResult state|>
        {{#let (this.dataToChart historyResult.data) as |chartData|}}
          <Polar @chartData={{chartData}} @chartOptions={{undefined}} />
        {{/let}}
      </:content>
    </Request>
  </template>
}
