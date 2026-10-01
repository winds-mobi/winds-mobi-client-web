import Service, { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';

// How a station list renders. The map is a peer of the two card layouts, not a
// separate kind of page: all three draw the same already-loaded stations, so
// switching between them never changes which stations are shown.
export type StationViewMode = 'cards' | 'compact' | 'map';

// The card layouts alone, for the grid that renders them.
export type StationCardViewMode = Exclude<StationViewMode, 'map'>;

// The surfaces that each remember their own view mode: one per data source.
// Choosing dense rows for the all-stations list doesn't also shrink the
// curated favourites list.
export type StationListSurface = 'all' | 'favorites' | 'hidden';

// All-stations opens as a map; the two curated lists open as cards. Each is
// only the starting point — whatever the visitor picks is remembered from
// then on via that surface's own `view` query param. The controllers use these
// same values as their `view` defaults (e.g. app/controllers/all.ts): Ember
// leaves a query param out of the URL while it equals that default, so the
// two must never disagree.
export const DEFAULT_VIEW_MODES: Record<StationListSurface, StationViewMode> = {
  all: 'map',
  favorites: 'cards',
  hidden: 'cards',
};

const VIEW_MODES: readonly StationViewMode[] = ['cards', 'compact', 'map'];

function isStationViewMode(value: unknown): value is StationViewMode {
  return (
    typeof value === 'string' &&
    (VIEW_MODES as readonly string[]).includes(value)
  );
}

// The view mode each surface is currently showing, chosen in the navbar beside
// the surface links (see app/components/navbar/menu/view-switch.gts) rather
// than on the Settings page: it changes what you are looking at while you look
// at it. Lives entirely in that surface's routed `view` query param — not
// persisted anywhere of its own — so a link can point at a specific view (see
// `focusQueryParamsFor` in app/utils/map-view.ts) and the address bar always
// reflects what's on screen.
export default class StationViewService extends Service {
  @service declare router: RouterService;

  modeFor(surface: StationListSurface): StationViewMode {
    const raw = this.router.currentRoute?.queryParams['view'];
    return isStationViewMode(raw) ? raw : DEFAULT_VIEW_MODES[surface];
  }

  // Targets whichever surface is currently routed — a query-param-only
  // transition, so an open station panel (its own, separate `station` query
  // param) is untouched: it simply stops rendering if the new mode isn't
  // 'map', and reappears instantly, with no refetch, if it changes back.
  setMode(mode: StationViewMode): void {
    void this.router.transitionTo({ queryParams: { view: mode } });
  }
}

declare module '@ember/service' {
  interface Registry {
    'station-view': StationViewService;
  }
}
