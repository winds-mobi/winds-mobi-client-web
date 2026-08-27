import Binoculars from 'ember-phosphor-icons/components/ph-binoculars';
import MapTrifold from 'ember-phosphor-icons/components/ph-map-trifold';
import Gear from 'ember-phosphor-icons/components/ph-gear';
import Heart from 'ember-phosphor-icons/components/ph-heart';
import Bell from 'ember-phosphor-icons/components/ph-bell';
import Lifebuoy from 'ember-phosphor-icons/components/ph-lifebuoy';
import type { IconComponent } from 'winds-mobi-client-web/utils/icon-component';

export interface NavbarMenuItem {
  icon: IconComponent;
  labelKey: string;
  route: 'alarms' | 'favorites' | 'help' | 'map' | 'nearby' | 'settings';
}

export const NAVBAR_MENU_ITEMS: readonly NavbarMenuItem[] = [
  {
    icon: MapTrifold,
    labelKey: 'navigation.map',
    route: 'map',
  },
  {
    icon: Binoculars,
    labelKey: 'navigation.nearby',
    route: 'nearby',
  },
  {
    icon: Heart,
    labelKey: 'navigation.favorites',
    route: 'favorites',
  },
  {
    icon: Bell,
    labelKey: 'navigation.alarms',
    route: 'alarms',
  },
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

// The favourites/alarms views are each a beta feature (see
// app/services/settings.ts); hide a nav entry unless the visitor has opted
// into beta features *and* that feature's own toggle.
export function visibleNavbarMenuItems(
  betaFeaturesEnabled: boolean,
  favoritesFeatureEnabled: boolean,
  alarmsFeatureEnabled: boolean
): readonly NavbarMenuItem[] {
  return NAVBAR_MENU_ITEMS.filter((item) => {
    if (item.route === 'favorites') {
      return betaFeaturesEnabled && favoritesFeatureEnabled;
    }

    if (item.route === 'alarms') {
      return betaFeaturesEnabled && alarmsFeatureEnabled;
    }

    return true;
  });
}
