import Modifier from 'ember-modifier';
import type { Map as MaplibreMap } from 'ember-maplibre-gl';
import {
  applyMapPadding,
  type MapPadding,
} from 'winds-mobi-client-web/utils/map-padding';
import {
  mapViewCenter,
  mapViewsEqual,
  type MapView,
} from 'winds-mobi-client-web/utils/map-view';

interface DriveMapCameraSignature {
  Element: HTMLElement;
  Args: {
    Positional: [
      map: MaplibreMap | undefined,
      view: MapView,
      padding: MapPadding,
    ];
  };
}

// The one and only thing that moves the map's camera, given the padding for the
// part of the map the station panel covers (none while it's closed). It does
// two things, in this order and never separately:
//
// 1. Matches MapLibre's padding to that, absorbing the change so
//    the view holds still (see `applyMapPadding`). Opening or closing the panel
//    is nothing but this — the map stays exactly where the user left it (#155).
// 2. Flies to the routed view, but only when that view actually changed — a
//    search result, a nearby card, a deep link, the locate button. Compared by
//    value, not by reference: a transition that leaves the view alone (opening
//    a panel, switching stations) must not move the camera, and that has to
//    hold however the routed view reaches this modifier.
//
// Both live here, rather than the padding in a modifier and the flight in a
// declarative `<map.call @func="flyTo">`, because those two run in different
// phases: template helpers evaluate during render, modifiers afterwards during
// commit, so a transition that opens the panel *and* moves the view would start
// the flight first and then have the padding change stop it mid-air (MapLibre's
// camera methods stop whatever is in flight). One writer, one order, no race:
// padding is settled before the flight starts, so the flight already frames its
// destination inside the part of the map the panel leaves visible.
export default class DriveMapCameraModifier extends Modifier<DriveMapCameraSignature> {
  private map?: MaplibreMap;
  private lastView?: MapView;

  modify(
    _element: HTMLElement,
    [map, view, padding]: [MaplibreMap | undefined, MapView, MapPadding]
  ) {
    if (!map) {
      return;
    }

    if (map !== this.map) {
      this.map = map;

      // The map was built at the routed view with the panel's padding already
      // set (`SettledMap`), so this jump normally changes nothing: it only
      // catches the routed view up if it changed while the map was loading. A
      // jump, not a flight, so a map that just appeared never slides.
      map.jumpTo({ center: mapViewCenter(view), zoom: view.zoom, padding });
      this.lastView = view;

      return;
    }

    // Also how a rotated phone or a resized window lands here: crossing the
    // panel's breakpoint changes the padding this is given.
    applyMapPadding(map, padding);

    if (this.lastView && mapViewsEqual(this.lastView, view)) {
      return;
    }

    this.lastView = view;

    // No `padding` of its own: the transform already carries the padding
    // `applyMapPadding` just settled, and MapLibre keeps it for any camera call
    // that doesn't name one.
    map.flyTo({ center: mapViewCenter(view), zoom: view.zoom });
  }
}
