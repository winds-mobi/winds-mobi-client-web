import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import { Request } from '@warp-drive/ember';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import WindDirectionGraph from './wind-direction/graph';
import type {
  History,
  StoreService,
} from 'winds-mobi-client-web/services/store.js';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

export interface StationWindDirectionThumbnailSignature {
  Args: {
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLDivElement;
}

const DURATION = 1 * 60 * 60;
const EMPTY_HISTORY: History[] = [];
const HISTORY_KEYS = ['w-dir', 'w-avg', 'w-max'];

// A shrunk version of `station/last-hour`'s polar graph, for rows where there
// is no room for a full section card with min/mean/max stats (e.g. the
// compact nearby list, #64). Fetches the same 1-hour history independently
// rather than sharing `StationLastHour`'s request, since the two render in
// different contexts and never appear together for the same station.
export default class StationWindDirectionThumbnail extends Component<StationWindDirectionThumbnailSignature> {
  @service declare store: StoreService;
  @service declare mapRefresh: MapRefreshService;

  @cached
  get historyRequest() {
    void this.mapRefresh.lastRefresh;

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
    <div class="min-h-0 min-w-0" ...attributes>
      <Request @request={{this.historyRequest}}>
        <:content as |result|>
          <WindDirectionGraph @data={{result.data}} @compact={{true}} />
        </:content>

        <:loading>
          <WindDirectionGraph @data={{EMPTY_HISTORY}} @compact={{true}} />
        </:loading>

        <:error>
          <WindDirectionGraph @data={{EMPTY_HISTORY}} @compact={{true}} />
        </:error>
      </Request>
    </div>
  </template>
}
