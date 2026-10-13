import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

// The same condition the station panel's overlay slot uses to switch shape
// (see `app/components/map/index.gts`'s slot div: default is a bottom sheet,
// `landscape:`/`md:` switch to a side panel).
export const SIDE_PANEL_QUERY = '(orientation: landscape), (min-width: 768px)';

// Which shape the station panel takes — a side panel in landscape and from
// `md` up, a bottom sheet otherwise — for everything that depends on it: the
// Drawer's placement (`components/station`) and the map's padding
// (`components/map`, `drive-map-camera`). Starts from the media query itself,
// so it's right from the very first render (the map is built with the padding
// for it), and follows rotation and resizing through the `trackMediaQuery`
// modifier on the map, the one subscription to it.
export default class PanelPlacementService extends Service {
  @tracked isSidePanel = window.matchMedia(SIDE_PANEL_QUERY).matches;

  get placement(): 'left' | 'bottom' {
    return this.isSidePanel ? 'left' : 'bottom';
  }

  setIsSidePanel = (matches: boolean): void => {
    this.isSidePanel = matches;
  };
}

declare module '@ember/service' {
  interface Registry {
    'panel-placement': PanelPlacementService;
  }
}
