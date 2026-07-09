import Binoculars from 'ember-phosphor-icons/components/ph-binoculars';
import MapTrifold from 'ember-phosphor-icons/components/ph-map-trifold';
import Gear from 'ember-phosphor-icons/components/ph-gear';
import Lifebuoy from 'ember-phosphor-icons/components/ph-lifebuoy';
import Star from 'ember-phosphor-icons/components/ph-star';
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
    icon: Star,
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
// its nav entry until the visitor has opted into beta features.
export function visibleNavbarMenuItems(
  betaFeaturesEnabled: boolean
): readonly NavbarMenuItem[] {
  return betaFeaturesEnabled
    ? NAVBAR_MENU_ITEMS
    : NAVBAR_MENU_ITEMS.filter((item) => item.route !== 'favorites');
}
