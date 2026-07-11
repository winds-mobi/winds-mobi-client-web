import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import { Request } from '@warp-drive/ember';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import StationSectionCard from './section-card';
import type {
  History,
  StoreService,
} from 'winds-mobi-client-web/services/store';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

export interface StationHistorySectionSignature {
  Args: {
    stationId: string;
    title: string;
    duration: number;
    keys: string[];
  };
  Blocks: {
    // Rendered for the resolved history and, with an empty list, while loading
    // or on error — so the presenter draws an empty chart instead of flashing.
    default: [history: History[]];
  };
  Element: null;
}

const EMPTY_HISTORY: History[] = [];

// The shared fetcher half of a station history section: requests the `history`
// for a station over `@duration` with the given sparse-fieldset `@keys`,
// re-fetching on each refresh tick, and yields the readings to a presenter block.
// The three sections (wind, air, last-hour) differ only in title, duration, keys,
// and presenter — see CLAUDE.md for the per-section keys.
export default class StationHistorySection extends Component<StationHistorySectionSignature> {
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
    <StationSectionCard @title={{@title}}>
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
    </StationSectionCard>
  </template>
}
