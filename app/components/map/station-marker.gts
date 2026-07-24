import Component from '@glimmer/component';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import {
  ARROW_DIRECTION_OFFSET,
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

  // Shrink the whole arrow by reading age when the preference is on, and
  // always by map zoom so markers don't dwarf the map when zoomed out to see
  // a whole region. The two multiply together, so an old reading at a low
  // zoom shrinks further still. Recomputed each refresh cycle as new readings
  // replace the record, so no timer is needed — the data only changes on
  // refresh anyway; the zoom factor is recomputed whenever the routed zoom
  // (settled after a pan/zoom gesture) changes.
  get markerScale() {
    const ageScale = this.settings.shrinkOldData
      ? scaleForReadingAge(this.args.station.last.timestamp)
      : 1;

    return ageScale * scaleForZoom(this.args.zoom);
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

  // The div's own box (h-14, 56px) is deliberately bigger than the svg it
  // wraps (h-12, 48px, the arrow's natural drawn size), so the ring reads as
  // just outside the arrow's silhouette rather than hugging its edges -- the
  // same 7:6 ratio as the previous h-28/h-24 sizing, just at a footprint
  // that doesn't dwarf the map at full zoom/a fresh reading (`markerScale`
  // of 1).
  get markerClass() {
    const base =
      'flex h-14 w-14 cursor-pointer items-center justify-center rounded-full p-1 transition';

    // Selected: a grey disc + ring hugging the arrow so it stands out without
    // spilling into neighbouring markers' clickable area.
    return this.args.isSelected
      ? `${base} bg-slate-400/40 ring-1 ring-inset ring-slate-500/70`
      : base;
  }

  <template>
    {{! template-lint-disable no-inline-styles }}
    <div
      data-selected={{if @isSelected "true"}}
      data-station-id={{@station.id}}
      data-test-map-station-marker
      class={{this.markerClass}}
      style={{this.scaleStyle}}
    >
      {{! template-lint-enable no-inline-styles }}
      <svg aria-hidden="true" class="h-12 w-12" viewBox={{this.viewBox}}>
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
