export interface NavbarMenuItem {
  labelKey: string;
  route: 'help' | 'map' | 'nearby';
}

export const NAVBAR_MENU_ITEMS: readonly NavbarMenuItem[] = [
  {
    labelKey: 'navigation.map',
    route: 'map',
  },
  {
    labelKey: 'navigation.nearby',
    route: 'nearby',
  },
  {
    labelKey: 'navigation.help',
    route: 'help',
  },
];
