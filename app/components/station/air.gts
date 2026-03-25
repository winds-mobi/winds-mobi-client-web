import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import { Request } from '@warp-drive/ember';
import { t } from 'ember-intl';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import StationSectionCard from './section-card';
import type { History } from 'winds-mobi-client-web/services/store.js';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import StationAirContent from './air-content';

export interface StationAirSignature {
  Args: {
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const DURATION = 435600;
const EMPTY_HISTORY: History[] = [];
const HISTORY_KEYS = ['temp', 'hum', 'rain'];

export default class StationAir extends Component<StationAirSignature> {
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;
  @service declare mapRefresh: MapRefreshService;

  @cached
  get historyRequest() {
    this.mapRefresh.lastRefresh;

    return this.store.request<{ data: History[] }>(
      historyQuery<History>(
        'history',
        this.args.stationId,
        {
          duration: DURATION,
          keys: HISTORY_KEYS,
        },
        {
          backgroundReload: true,
        }
      )
    );
  }

  <template>
    <section data-test-station-air-section>
      <StationSectionCard @title={{t "station.air"}}>
        <Request @request={{this.historyRequest}}>
          <:content as |result|>
            <StationAirContent @history={{result.data}} />
          </:content>

          <:loading>
            <StationAirContent @history={{EMPTY_HISTORY}} />
          </:loading>

          <:error>
            <StationAirContent @history={{EMPTY_HISTORY}} />
          </:error>
        </Request>
      </StationSectionCard>
    </section>
  </template>
}
