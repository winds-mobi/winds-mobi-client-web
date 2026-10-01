import MapTrifold from 'ember-phosphor-icons/components/ph-map-trifold';
import Gear from 'ember-phosphor-icons/components/ph-gear';
import Heart from 'ember-phosphor-icons/components/ph-heart';
import Lifebuoy from 'ember-phosphor-icons/components/ph-lifebuoy';
import type { StationListSurface } from 'winds-mobi-client-web/services/station-view';
import type { IconComponent } from 'winds-mobi-client-web/utils/icon-component';

export interface NavbarMenuItem {
  icon: IconComponent;
  labelKey: string;
  route: 'all' | 'favorites' | 'help' | 'settings';
}

// Which stations you are looking at. Paired in the navbar with the view
// switch, which says how they are drawn. Hidden stations are deliberately not
// here: hiding is rare, so that list is reached from Settings instead.
export const NAVBAR_SURFACE_ITEMS: readonly NavbarMenuItem[] = [
  {
    icon: MapTrifold,
    labelKey: 'navigation.allStations',
    route: 'all',
  },
  {
    icon: Heart,
    labelKey: 'navigation.favorites',
    route: 'favorites',
  },
];

// Everything that isn't a station list. Its own group, so the station
// navigation reads as one set of choices rather than five unrelated links.
export const NAVBAR_UTILITY_ITEMS: readonly NavbarMenuItem[] = [
  {
    icon: Gear,
    labelKey: 'navigation.settings',
    route: 'settings',
  },
  {
    icon: Lifebuoy,
    labelKey: 'navigation.help',
    route: 'help',
  },
];

// Which station list a route is showing, or undefined for routes that show
// none (Settings, Help). The Hidden page counts even without a navbar link, so
// it still gets the view switch. Drives whether the navbar offers a view switch, and
// which surface's remembered mode it reflects.
export function surfaceForRoute(
  routeName: string | null | undefined
): StationListSurface | undefined {
  if (!routeName) {
    return undefined;
  }

  const [root] = routeName.split('.');

  if (root === 'all' || root === 'favorites' || root === 'hidden') {
    return root;
  }

  return undefined;
}
