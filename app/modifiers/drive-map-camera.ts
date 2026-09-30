import Modifier from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';
import type { Map as MaplibreMap } from 'ember-maplibre-gl';
import {
  applyMapPadding,
  mapPaddingForPlacement,
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
      isSidePanel: boolean,
    ];
  };
}

// The station panel's padding is reserved permanently, whether or not a panel
// is actually open, rather than toggling on open/close. There is then no
// padding *change* left for opening/closing a panel to cause, so #155 stays
// fixed for a structural reason rather than an absorb-the-change trick --
// traded for the map's routed center sitting off-center even with no panel
// open, which reads as intentional framing (matching wherever the panel will
// appear) rather than a bug.
//
// The one and only thing that moves the map's camera, attached to the station
// panel's overlay slot so it can measure how much of the map that panel covers.
// It does two things, in this order and never separately:
//
// 1. Matches MapLibre's padding to the panel's breakpoint (see
//    `applyMapPadding`), absorbing any *breakpoint* change (a rotation, a
//    resize across the side-panel/bottom-sheet boundary) so the view holds
//    still.
// 2. Flies to the routed view, but only when that view actually changed — a
//    search result, a nearby card, a deep link, the locate button. Compared by
//    value, not by reference: a transition that leaves the view alone (opening
//    a panel, switching stations) must not move the camera, and that has to
//    hold however the routed view reaches this modifier.
//
// Both live here, rather than the padding in a modifier and the flight in a
// declarative `<map.call @func="flyTo">`, because those two run in different
// phases: template helpers evaluate during render, modifiers afterwards during
// commit, so a transition that moves the view *and* flips the breakpoint would
// start the flight first and then have the padding change stop it mid-air
// (MapLibre's camera methods stop whatever is in flight). One writer, one
// order, no race: padding is settled before the flight starts, so the flight
// already frames its destination inside the part of the map the panel leaves
// visible.
export default class DriveMapCameraModifier extends Modifier<DriveMapCameraSignature> {
  private map?: MaplibreMap;
  private isSidePanel = false;
  private lastView?: MapView;

  modify(
    _element: HTMLElement,
    [map, view, isSidePanel]: [MaplibreMap | undefined, MapView, boolean]
  ) {
    this.isSidePanel = isSidePanel;

    if (!map) {
      return;
    }

    if (map !== this.map) {
      this.map = map;

      // The panel's padding is hardcoded per breakpoint (see
      // `mapPaddingForPlacement`), not measured — this only needs to re-run for
      // a rotated phone or a resized window, where the breakpoint itself may
      // flip. MapLibre's own event rather than an observer of ours, and
      // harmless when the recomputed padding comes back unchanged
      // (`applyMapPadding` no-ops).
      map.on('resize', this.syncPadding);
      registerDestructor(this, () => map.off('resize', this.syncPadding));

      // A map MapLibre just finished constructing always starts at `view`
      // with zero padding (its own `MapOptions` has no `padding` to
      // construct with). Setting the true destination and the permanent
      // padding together, in one jump, means there is no unpadded frame that
      // ever gets shown for the panel to later "open into" — padding is a
      // property of the map now, not of whether a panel happens to be open.
      this.lastView = view;
      map.jumpTo({
        center: mapViewCenter(view),
        zoom: view.zoom,
        padding: mapPaddingForPlacement(isSidePanel),
      });

      return;
    }

    this.syncPadding();

    if (this.lastView && mapViewsEqual(this.lastView, view)) {
      return;
    }

    this.lastView = view;

    // No `padding` of its own: the transform already carries the padding
    // `syncPadding` just settled, and MapLibre keeps it for any camera call
    // that doesn't name one.
    map.flyTo({ center: mapViewCenter(view), zoom: view.zoom });
  }

  private syncPadding = () => {
    if (!this.map) {
      return;
    }

    applyMapPadding(this.map, mapPaddingForPlacement(this.isSidePanel));
  };
}
