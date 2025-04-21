import Component from '@glimmer/component';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import type { History } from 'winds-mobi-client-web/services/store.js';
import { inject as service } from '@ember/service';
import { Request } from '@warp-drive/ember';
import type StoreService from 'winds-mobi-client-web/services/store.js';
import StationWindsGraph from './graph';

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

  <template>
    <Request @request={{this.historyRequest}}>
      <:content as |historyResult|>
        <StationWindsGraph @data={{historyResult.data}} />
      </:content>
    </Request>
  </template>
}
