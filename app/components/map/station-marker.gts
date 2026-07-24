import Component from '@glimmer/component';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import selectMapMarker from 'winds-mobi-client-web/modifiers/select-map-marker';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import {
  ARROW_DIRECTION_OFFSET,
  ARROW_SCALE,
  BASE_MARKER_SIZE,
  colourForWindReading,
  MARKER_OUTLINE_WIDTH,
  MARKER_PLAIN_OUTLINE_COLOUR,
  scaleForReadingAge,
  scaleForZoom,
  stationArrowGeometry,
} from 'winds-mobi-client-web/utils/station-arrow';
import type { Station } from 'winds-mobi-client-web/services/store';

export interface MapStationMarkerSignature {
  Args: {
    isSelected?: boolean;
    station: Station;
    zoom: number;
  };
  Element: HTMLDivElement;
}

// Purely presentational -- the ring/disc and the arrow inside it. Clicking is
// handled by the MapLibre marker itself (see `map/index.gts`'s `<marker.on
// @event="click" ...>`), not by anything in this component: MapLibre's own
// `Marker` element continuously repositions itself via CSS `transform`
// during every pan/zoom/momentum-settle, and a second, independently
// clickable element layered on top would give mobile browsers a second
// thing that can be moving mid-tap -- a known trigger for a touch's
// synthesized click getting silently dropped (a target that moves between
// touchstart and touchend reads as a scroll/pan, not a tap). The marker's
// own click is reliable and carries the selection instead. This does mean
// no keyboard Enter/Space activation -- MapLibre's marker only wires those
// keys to toggling a popup, not a generic click.
export default class MapStationMarker extends Component<MapStationMarkerSignature> {
  @service declare settings: SettingsService;

  get geometry() {
    return stationArrowGeometry(this.args.station.isPeak);
  }

  get arrowPath() {
    return this.geometry.path;
  }

  get viewBox() {
    return this.geometry.viewBox;
  }

  get markerColor() {
    const { speed, timestamp } = this.args.station.last;
    return colourForWindReading(speed, timestamp);
  }

  get gustsColor() {
    const { gusts, timestamp } = this.args.station.last;
    return colourForWindReading(gusts, timestamp);
  }

  // Fill the hub with the gusts colour only when the preference is on and the
  // gusts fall in a different wind band than the average (different displayed
  // colour) — so the hub adds information instead of repeating the body colour.
  get showGustsHub() {
    return (
      this.settings.showGustsOutline && this.gustsColor !== this.markerColor
    );
  }

  // ARROW_SCALE is a flat overall-size multiplier (see its comment in
  // station-arrow.ts). On top of that, shrink the whole marker by reading
  // age when the preference is on, and always by map zoom so markers don't
  // dwarf the map when zoomed out to see a whole region. All three multiply
  // together, so an old reading at a low zoom shrinks further still.
  // Recomputed each refresh cycle as new readings replace the record, so no
  // timer is needed — the data only changes on refresh anyway; the zoom
  // factor is recomputed whenever the routed zoom (settled after a pan/zoom
  // gesture) changes.
  get markerScale() {
    const ageScale = this.settings.shrinkOldData
      ? scaleForReadingAge(this.args.station.last.timestamp)
      : 1;

    return ARROW_SCALE * ageScale * scaleForZoom(this.args.zoom);
  }

  // The actual rendered box (px) for both the ring and the arrow together —
  // see `sizeStyle` below for why this drives real `width`/`height` rather
  // than a `transform: scale(...)`.
  get markerSizePx() {
    return BASE_MARKER_SIZE * this.markerScale;
  }

  // Rotate to the wind direction about the hub centre. `rotate(angle cx cy)`
  // takes its centre natively, unlike scale, so this needs no recentring
  // trick of its own.
  get markerTransform() {
    const centre = this.geometry.rotationCentre;
    const angle = this.args.station.last.direction + ARROW_DIRECTION_OFFSET;
    return `rotate(${angle} ${centre})`;
  }

  // Sets the div's real `width`/`height` (`markerSizePx` above) rather than
  // a `transform: scale(...)`, so the ring (the outer `.maplibregl-marker`
  // element, which shrink-wraps to this div's own layout box) tracks the
  // arrow's size instead of staying a fixed size around a shrunk arrow -- a
  // `transform` only affects an element's own painted/hit-test region, never
  // the layout box an ancestor uses to size itself around it. This also
  // keeps the marker's real clickable area (the outer element, see
  // `markerInitOptions` in map/index.gts) matching its current visual size,
  // so neighbouring markers' click areas don't overlap more than their
  // visible arrows do at a shrunk zoom level. The svg fills this box
  // (`h-full w-full`), and MapLibre's own `anchor: 'center'` recentring is
  // percentage-based, so it stays correct as the box resizes.
  get sizeStyle() {
    const size = this.markerSizePx;
    return htmlSafe(`width: ${size}px; height: ${size}px;`);
  }

  // `cursor-pointer` and `rounded-full` live on the MapLibre marker element
  // itself (`markerInitOptions` in map/index.gts, a static shape), and the
  // selected-state ring lives there too, toggled by the `selectMapMarker`
  // modifier below (reactive, so it can't be a static `className` -- see the
  // modifier's own comment). Size comes entirely from `sizeStyle` above
  // (real `width`/`height`), so this only carries classes that don't vary
  // with scale; `transition-[width,height]` keeps resizes smooth (Tailwind's
  // `transition` utility covers `transform`, not `width`/`height`). `p-1`
  // gives the arrow a small fixed gap from the ring's edge (Tailwind's
  // preflight sets `box-sizing: border-box` app-wide, so this padding carves
  // into `sizeStyle`'s box rather than growing past it) -- being a fixed px
  // amount rather than a percentage, that gap becomes proportionally bigger
  // the smaller a marker shrinks.
  markerClass =
    'flex items-center justify-center p-1 transition-[width,height]';

  <template>
    {{! template-lint-disable no-inline-styles }}
    <div
      data-selected={{if @isSelected "true"}}
      data-station-id={{@station.id}}
      data-test-map-station-marker
      class={{this.markerClass}}
      style={{this.sizeStyle}}
      {{selectMapMarker @isSelected}}
    >
      {{! template-lint-enable no-inline-styles }}
      <svg aria-hidden="true" class="h-full w-full" viewBox={{this.viewBox}}>
        <g transform={{this.markerTransform}}>
          {{! Gusts band differs: the gusts shape behind, shown through the hub hole. }}
          {{#if this.showGustsHub}}
            <path d={{this.geometry.gustsPath}} fill={{this.gustsColor}} />
          {{/if}}
          {{! Plain black hairline outline, grown outward via paint-order. }}
          <path
            d={{this.arrowPath}}
            fill={{this.markerColor}}
            paint-order="stroke"
            stroke={{MARKER_PLAIN_OUTLINE_COLOUR}}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={{MARKER_OUTLINE_WIDTH}}
          />
        </g>
      </svg>
    </div>
  </template>
}
