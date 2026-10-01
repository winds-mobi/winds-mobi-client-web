import Component from '@glimmer/component';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import StationPanel from './index';
import StationGrid from './grid';
import Map from 'winds-mobi-client-web/components/map';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import type StationViewService from 'winds-mobi-client-web/services/station-view';
import type {
  StationCardViewMode,
  StationListSurface,
  StationViewMode,
} from 'winds-mobi-client-web/services/station-view';
import { currentStationDetailId } from 'winds-mobi-client-web/utils/station-detail';
import type { MapView } from 'winds-mobi-client-web/utils/map-view';

export interface StationListViewSignature {
  Args: {
    stations: Station[];
    surface: StationListSurface;
    // Only the closest stations to list as cards, when that's narrower than
    // the full set drawn on the map -- the all-stations route's map draws
    // everything in the area while its card view lists just the nearest
    // handful. Defaults to `stations`, which is already the right list for
    // favourites/hidden, where both views show the same curated set.
    cardStations?: Station[];
    // The routed camera, passed only by the all-stations route -- see Map's
    // own signature for what its presence decides.
    mapView?: MapView;
  };
  Element: null;
}

// Draws a station list in whichever mode its surface is currently set to (the
// navbar's view switch sets it). All the modes render the same already-loaded
// stations, so switching never changes which stations are shown.
export default class StationListView extends Component<StationListViewSignature> {
  @service declare router: RouterService;
  @service('station-view') declare stationView: StationViewService;

  get view(): StationViewMode {
    return this.stationView.modeFor(this.args.surface);
  }

  get isMap(): boolean {
    return this.view === 'map';
  }

  // The grid renders card layouts only; the map is its own renderer.
  get cardView(): StationCardViewMode {
    return this.view === 'compact' ? 'compact' : 'cards';
  }

  get cardStations(): Station[] {
    return this.args.cardStations ?? this.args.stations;
  }

  // The panel only ever shows over the map (see the else branch, which never
  // renders it) -- switching to cards leaves `station` in the URL alone but
  // stops rendering the panel, so switching back restores it with no refetch.
  get stationId(): string | undefined {
    return currentStationDetailId(this.router);
  }

  // Owns the whole content area, not just what sits inside a page's padding:
  // a map fills it edge to edge exactly as the map route does, while cards
  // scroll inside the usual gutters.
  <template>
    {{#if this.isMap}}
      {{! With no `@mapView` this frames `@stations` itself instead of
      following the URL -- see Map's own signature for what that argument
      decides. }}
      <div class="min-h-0 flex-1 overflow-hidden" data-test-station-map-view>
        <Map @mapView={{@mapView}} @stations={{@stations}}>
          {{#if this.stationId}}
            <StationPanel @stationId={{this.stationId}} />
          {{/if}}
        </Map>
      </div>
    {{else}}
      <section
        class="min-h-0 flex-1 overflow-y-auto bg-slate-200"
        data-test-station-card-list={{@surface}}
      >
        <div
          class="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <StationGrid
            @stations={{this.cardStations}}
            @view={{this.cardView}}
            @surface={{@surface}}
          />
        </div>
      </section>
    {{/if}}
  </template>
}
