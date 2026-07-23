import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import { Button } from '@frontile/buttons';
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
    onSelect: (station: Station) => void;
    station: Station;
    zoom: number;
  };
  Element: HTMLButtonElement;
}

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

  // Age/zoom shrink applied as a CSS transform on the button itself, rather
  // than an SVG-space scale on the inner <g>, so the button's own click
  // target and the arrow it wraps shrink together as one unit -- a stale or
  // zoomed-out station gets a smaller tap target to match its smaller
  // silhouette, rather than a full-size ring around a shrunken arrow. This
  // also sidesteps SVG's `scale()` always scaling about the origin: CSS
  // transforms default to `transform-origin: center`, and the button's own
  // box is already centred on the hub (the svg's `viewBox` is centred on it,
  // and `flex! items-center justify-center` centres the svg within the
  // button), so scaling the button needs no manual recentring either.
  get scaleStyle() {
    return htmlSafe(`transform: scale(${this.markerScale});`);
  }

  // Frontile's Button doesn't tailwind-merge its `class` arg against the
  // theme's own base/variant classes (verified empirically -- both a passed
  // override and the conflicting theme class end up in the DOM, and CSS
  // source order decides the winner, not attribute order). `!` forces our
  // override to win regardless: without it, the theme's own `rounded-sm`/
  // default-size padding non-deterministically fight this button's own
  // `rounded-full`/`p-1`.
  //
  // The button's own box (h-28, 112px) is deliberately bigger than the svg it
  // wraps (h-24, 96px, the arrow's natural drawn size) -- even after `p-1!`'s
  // padding and Frontile's own 1px border eat into the interior (down to
  // 102px), the svg still fits inside with room to spare, so the ring reads
  // as just outside the arrow's silhouette rather than hugging its edges.
  // `flex! items-center justify-center` centres the svg within that
  // interior; `!` forces it over Frontile's own base `inline-block`
  // (verified in `@frontile/theme`'s `baseButton`), which otherwise wins the
  // `display` property by source order (same unmerged-class gotcha as
  // elsewhere in this file) and leaves the svg anchored top-left instead of
  // centred.
  get buttonClass() {
    const base =
      'flex! h-28 w-28 cursor-pointer items-center justify-center rounded-full! p-1! transition focus:outline-none';

    // Selected: a grey disc + ring hugging the arrow so it stands out without
    // spilling into neighbouring markers' clickable area.
    return this.args.isSelected
      ? `${base} bg-slate-400/40 ring-1 ring-inset ring-slate-500/70`
      : base;
  }

  @action
  handleSelect() {
    this.args.onSelect(this.args.station);
  }

  <template>
    {{! template-lint-disable no-inline-styles }}
    <Button
      aria-label={{@station.name}}
      data-selected={{if @isSelected "true"}}
      data-station-id={{@station.id}}
      data-test-map-station-marker
      @appearance="custom"
      @intent="default"
      @onPress={{this.handleSelect}}
      class={{this.buttonClass}}
      style={{this.scaleStyle}}
    >
      {{! template-lint-enable no-inline-styles }}
      <svg aria-hidden="true" class="h-24 w-24" viewBox={{this.viewBox}}>
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
    </Button>
  </template>
}
