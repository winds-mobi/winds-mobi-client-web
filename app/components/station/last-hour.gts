import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import { Request } from '@warp-drive/ember';
import { t } from 'ember-intl';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import StationSectionCard from './section-card';
import type { History } from 'winds-mobi-client-web/services/store.js';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import StationLastHourContent from './last-hour-content';

export interface StationLastHourSignature {
  Args: {
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const DURATION = 1 * 60 * 60;
const EMPTY_HISTORY: History[] = [];
const HISTORY_KEYS = ['w-dir', 'w-avg', 'w-max'];

export default class StationLastHour extends Component<StationLastHourSignature> {
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
    <StationSectionCard @title={{t "wind.lastHour"}}>
      <Request @request={{this.historyRequest}}>
        <:content as |result|>
          <StationLastHourContent @history={{result.data}} />
        </:content>

        <:loading>
          <StationLastHourContent @history={{EMPTY_HISTORY}} />
        </:loading>

        <:error>
          <StationLastHourContent @history={{EMPTY_HISTORY}} />
        </:error>
      </Request>
    </StationSectionCard>
  </template>
}
