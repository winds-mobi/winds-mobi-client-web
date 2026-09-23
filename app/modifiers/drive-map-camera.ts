import Modifier from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';
import type { Map as MaplibreMap } from 'ember-maplibre-gl';
import {
  applyMapPadding,
  mapPaddingForPlacement,
  NO_MAP_PADDING,
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
      isPanelOpen: boolean,
      isSidePanel: boolean,
    ];
  };
}

// The one and only thing that moves the map's camera, attached to the station
// panel's overlay slot so it can measure how much of the map that panel covers.
// It does two things, in this order and never separately:
//
// 1. Matches MapLibre's padding to the covered area, absorbing the change so
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
  private isPanelOpen = false;
  private isSidePanel = false;
  private lastView?: MapView;

  modify(
    _element: HTMLElement,
    [map, view, isPanelOpen, isSidePanel]: [
      MaplibreMap | undefined,
      MapView,
      boolean,
      boolean,
    ]
  ) {
    this.isPanelOpen = isPanelOpen;
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

    applyMapPadding(
      this.map,
      this.isPanelOpen
        ? mapPaddingForPlacement(this.isSidePanel)
        : NO_MAP_PADDING
    );
  };
}
