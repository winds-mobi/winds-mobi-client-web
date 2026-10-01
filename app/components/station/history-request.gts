import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import { Request } from '@warp-drive/ember';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import type {
  History,
  StoreService,
} from 'winds-mobi-client-web/services/store';
import type RefreshService from 'winds-mobi-client-web/services/refresh';

export interface StationHistoryRequestSignature {
  Args: {
    stationId: string;
    duration: number;
    keys: string[];
  };
  Blocks: {
    // Rendered for the resolved history and, with an empty list, while loading
    // or on error — so a chart draws empty instead of flashing.
    default: [history: History[]];
  };
}

// The last hour of wind readings, shared by the last-hour section and the
// compact cards' wind-direction thumbnail so both ask for exactly the same
// request — and so share one cache entry.
export const LAST_HOUR_DURATION = 1 * 60 * 60;
export const LAST_HOUR_KEYS = ['w-dir', 'w-avg', 'w-max'];

const EMPTY_HISTORY: History[] = [];

// Requests the `history` for a station over `@duration` with the given
// sparse-fieldset `@keys`, re-fetching on each refresh tick, and yields the
// readings. Renders no markup of its own: callers decide what wraps it (a
// section card, a thumbnail's box).
export default class StationHistoryRequest extends Component<StationHistoryRequestSignature> {
  @service declare store: StoreService;
  @service declare refresh: RefreshService;

  @cached
  get historyRequest() {
    void this.refresh.lastRefresh;

    return this.store.request<{ data: History[] }>(
      historyQuery<History>(
        'history',
        this.args.stationId,
        {
          duration: this.args.duration,
          keys: this.args.keys,
        },
        {
          backgroundReload: true,
        }
      )
    );
  }

  <template>
    <Request @request={{this.historyRequest}}>
      <:content as |result|>
        {{yield result.data}}
      </:content>

      <:loading>
        {{yield EMPTY_HISTORY}}
      </:loading>

      <:error>
        {{yield EMPTY_HISTORY}}
      </:error>
    </Request>
  </template>
}
