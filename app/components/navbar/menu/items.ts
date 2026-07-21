import Binoculars from 'ember-phosphor-icons/components/ph-binoculars';
import MapTrifold from 'ember-phosphor-icons/components/ph-map-trifold';
import Gear from 'ember-phosphor-icons/components/ph-gear';
import Heart from 'ember-phosphor-icons/components/ph-heart';
import Lifebuoy from 'ember-phosphor-icons/components/ph-lifebuoy';
import type { IconComponent } from 'winds-mobi-client-web/utils/icon-component';

export interface NavbarMenuItem {
  icon: IconComponent;
  labelKey: string;
  route: 'favorites' | 'help' | 'map' | 'nearby' | 'settings';
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

// The favourites view is a beta feature (see app/services/settings.ts); hide
// its nav entry unless the visitor has opted into beta features *and* the
// favourites feature's own toggle.
export function visibleNavbarMenuItems(
  betaFeaturesEnabled: boolean,
  favoritesFeatureEnabled: boolean
): readonly NavbarMenuItem[] {
  return betaFeaturesEnabled && favoritesFeatureEnabled
    ? NAVBAR_MENU_ITEMS
    : NAVBAR_MENU_ITEMS.filter((item) => item.route !== 'favorites');
}
