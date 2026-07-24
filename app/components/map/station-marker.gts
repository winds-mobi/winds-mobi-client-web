import Component from '@glimmer/component';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import selectMapMarker from 'winds-mobi-client-web/modifiers/select-map-marker';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import {
  ARROW_DIRECTION_OFFSET,
  ARROW_SCALE,
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
// handled by the MapLibre marker itself, not by anything in this component
// (see `map/index.gts`'s `<marker.on @event="click" ...>`): MapLibre's own
// `Marker` element already fires a native `click` (it uses this internally
// for popup-toggling), and continuously repositions itself via CSS
// `transform` during every pan/zoom/momentum-settle -- stacking our own
// separate clickable element (and its own `transform: scale(...)`) on top
// added a second thing that could be moving mid-tap, which is a known
// trigger for mobile browsers to silently drop a touch's synthesized click
// (a target that moves between touchstart and touchend reads as a
// scroll/pan, not a tap). Letting the marker's own already-reliable click
// carry the selection removes that extra layer. Traded away: keyboard
// Enter/Space activation, which this component's own real `<button>` used
// to give for free -- MapLibre's marker only wires Enter/Space to toggling a
// popup, not a generic click, and this app has decided that's an acceptable
// gap for now rather than wiring up a keyboard handler of its own.
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

  // ARROW_SCALE grows the arrow past the ring's fixed baseline (see the
  // svg's own class below and ARROW_SCALE's comment in station-arrow.ts).
  // On top of that, shrink the whole arrow by reading age when the
  // preference is on, and always by map zoom so markers don't dwarf the map
  // when zoomed out to see a whole region. All three multiply together, so
  // an old reading at a low zoom shrinks further still. Recomputed each
  // refresh cycle as new readings replace the record, so no timer is needed
  // — the data only changes on refresh anyway; the zoom factor is recomputed
  // whenever the routed zoom (settled after a pan/zoom gesture) changes.
  get markerScale() {
    const ageScale = this.settings.shrinkOldData
      ? scaleForReadingAge(this.args.station.last.timestamp)
      : 1;

    return ARROW_SCALE * ageScale * scaleForZoom(this.args.zoom);
  }

  // Rotate to the wind direction about the hub centre. `rotate(angle cx cy)`
  // takes its centre natively, unlike scale (see `scaleStyle` below), so this
  // needs no recentring trick of its own.
  get markerTransform() {
    const centre = this.geometry.rotationCentre;
    const angle = this.args.station.last.direction + ARROW_DIRECTION_OFFSET;
    return `rotate(${angle} ${centre})`;
  }

  // Age/zoom shrink applied as a CSS transform on the outer div itself,
  // rather than an SVG-space scale on the inner <g>, so the ring and the
  // arrow it wraps shrink together as one unit. This also sidesteps SVG's
  // `scale()` always scaling about the origin: CSS transforms default to
  // `transform-origin: center`, and the div's own box is already centred on
  // the hub (the svg's `viewBox` is centred on it, and `flex items-center
  // justify-center` centres the svg within the div), so scaling the div
  // needs no manual recentring either.
  get scaleStyle() {
    return htmlSafe(`transform: scale(${this.markerScale});`);
  }

  // `cursor-pointer` and `rounded-full` deliberately live on the MapLibre
  // marker element itself (`markerInitOptions` in map/index.gts, that shape
  // is static and never varies), and the selected-state ring lives there too,
  // toggled by the `selectMapMarker` modifier below (that one's reactive, so
  // it can't be a static `className` -- see the modifier's own comment). That
  // outer element's shrink-wrapped size comes from this div's own unscaled
  // layout box (h-20, 80px) alone -- the svg below deliberately carries no
  // `h-*`/`w-*` of its own (confirmed empirically that tuning them had no
  // visible effect anyway), so `ARROW_SCALE` (see station-arrow.ts) is the
  // only thing controlling the arrow's visible size, via the same
  // `transform: scale(...)` below.
  markerClass = 'flex h-20 w-20 items-center justify-center p-1 transition';

  <template>
    {{! template-lint-disable no-inline-styles }}
    <div
      data-selected={{if @isSelected "true"}}
      data-station-id={{@station.id}}
      data-test-map-station-marker
      class={{this.markerClass}}
      style={{this.scaleStyle}}
      {{selectMapMarker @isSelected}}
    >
      {{! template-lint-enable no-inline-styles }}
      <svg aria-hidden="true" viewBox={{this.viewBox}}>
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
