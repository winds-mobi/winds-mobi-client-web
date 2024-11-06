import Component from '@glimmer/component';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import type { History } from 'winds-mobi-client-web/services/store.js';
import { inject as service } from '@ember/service';
import { Request } from '@warp-drive/ember';
import type StoreService from 'winds-mobi-client-web/services/store.js';
import WindDirectionGraph from './graph';

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

export default class WindDirection extends Component<WindDirectionSignature> {
  @service declare store: StoreService;

  get historyRequest() {
    const options = historyQuery<History>('history', this.args.stationId, {
      duration: DURATION,
    });
    return this.store.request(options);
  }

  <template>
    <Request @request={{this.historyRequest}}>
      <:content as |historyResult state|>
        <WindDirectionGraph @data={{historyResult.data}} />
      </:content>
    </Request>
  </template>
}
