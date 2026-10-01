import Component from '@glimmer/component';
import type { TOC } from '@ember/component/template-only';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import { concat } from '@ember/helper';
import type { Future } from '@warp-drive/core/request';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import { Alert } from 'frontile/status';
import { Request } from '@warp-drive/ember';
import { byIdsQuery } from 'winds-mobi-client-web/builders/station';
import StationListView from './list-view';
import StationSectionCard from './section-card';
import type { StationListSurface } from 'winds-mobi-client-web/services/station-view';
import type {
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store';

export interface StationIdListPageSignature {
  Args: {
    // Favourites and Hidden only -- All stations has its own bounds-based
    // data source (see app/templates/all.gts) and doesn't manage an id list.
    surface: Exclude<StationListSurface, 'all'>;
    stationIds: string[];
  };
  Element: null;
}

// One of the page's non-list states (nothing saved, loading, failed), in the
// usual padded gutters -- the list itself fills the content area edge to edge.
const StatePanel: TOC<{
  Args: { title: string; titleClass?: string };
  Blocks: { default: [] };
  Element: HTMLElement;
}> = <template>
  <section class="min-h-0 flex-1 overflow-y-auto bg-slate-200">
    <div class="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <StationSectionCard
        @title={{@title}}
        @titleClass={{@titleClass}}
        ...attributes
      >
        {{yield}}
      </StationSectionCard>
    </div>
  </section>
</template>;

// The page behind Favourites and Hidden: both are "manage a locally-persisted
// list of station ids" views, differing only in which service owns that list
// -- everything else, including which service that is, is the caller's job.
// `@surface` doubles as the translation namespace (`favorites.*`/`hidden.*`)
// and every data-test hook below, since each is already spelled identically
// to its surface name.
export default class StationIdListPage extends Component<StationIdListPageSignature> {
  @service declare store: StoreService;

  // `undefined` when no ids are saved, which `<Request>` renders as `:idle`.
  // Editing the list is a new request, so `<StationListView>` (and its map)
  // remounts on that edit -- rare and deliberate, unlike `all.gts`'s
  // continuous pan/zoom, so not worth a latch.
  @cached
  get stationsRequest(): Future<{ data: Station[] }> | undefined {
    if (this.args.stationIds.length === 0) {
      return undefined;
    }

    return this.store.request<{ data: Station[] }>(
      byIdsQuery<Station>('station', this.args.stationIds)
    );
  }

  // The API doesn't guarantee response order — present in the order the
  // caller's own ids came in (added/hidden order).
  orderedStations = (stations: Station[]): Station[] => {
    const order = new Map(this.args.stationIds.map((id, index) => [id, index]));

    return [...stations].sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    );
  };

  <template>
    {{pageTitle (t (concat @surface ".title"))}}

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Request
        @request={{this.stationsRequest}}
        @autorefresh="invalid"
        @autorefreshBehavior="refresh"
      >
        <:content as |result|>
          <StationListView
            @stations={{this.orderedStations result.data}}
            @surface={{@surface}}
          />
        </:content>

        <:idle>
          <StatePanel
            data-test-id-list-empty={{@surface}}
            @title={{t (concat @surface ".title")}}
          >
            <Alert
              @status="neutral"
              @title={{t (concat @surface ".emptyTitle")}}
              @description={{t (concat @surface ".emptyDescription")}}
            />
          </StatePanel>
        </:idle>

        <:loading>
          <StatePanel
            data-test-id-list-loading={{@surface}}
            @title={{t (concat @surface ".title")}}
          >
            <Alert
              @status="neutral"
              @title={{t (concat @surface ".loading")}}
            />
          </StatePanel>
        </:loading>

        <:error>
          <StatePanel
            data-test-id-list-error={{@surface}}
            @title={{t (concat @surface ".title")}}
            @titleClass="text-rose-700"
          >
            <Alert
              @status="danger"
              @title={{t (concat @surface ".requestError")}}
            />
          </StatePanel>
        </:error>
      </Request>
    </div>
  </template>
}
