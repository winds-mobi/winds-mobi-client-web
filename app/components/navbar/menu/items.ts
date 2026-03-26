import type { ComponentLike } from '@glint/template';
import Binoculars from 'ember-phosphor-icons/components/ph-binoculars';
import MapTrifold from 'ember-phosphor-icons/components/ph-map-trifold';
import Lifebuoy from 'ember-phosphor-icons/components/ph-lifebuoy';

export interface NavbarMenuItem {
  icon: ComponentLike<{
    Args: {
      size?: number;
    };
  }>;
  labelKey: string;
  route: 'help' | 'map' | 'nearby';
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
    icon: Lifebuoy,
    labelKey: 'navigation.help',
    route: 'help',
  },
];
