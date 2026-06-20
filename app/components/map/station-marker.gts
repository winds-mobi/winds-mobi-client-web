import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import {
  ARROW_DIRECTION_OFFSET,
  colourForWindReading,
  MARKER_OUTLINE_WIDTH,
  MARKER_PLAIN_OUTLINE_COLOUR,
  scaleForReadingAge,
  stationArrowGeometry,
} from 'winds-mobi-client-web/utils/station-arrow';
import type { Station } from 'winds-mobi-client-web/services/store';

export interface MapStationMarkerSignature {
  Args: {
    isSelected?: boolean;
    onSelect: (station: Station) => void;
    station: Station;
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

  // Shrink the whole arrow by reading age when the preference is on. Recomputed
  // each refresh cycle as new readings replace the record, so no timer is needed
  // — the data only changes on refresh anyway.
  get markerScale() {
    if (!this.settings.shrinkOldData) {
      return 1;
    }

    return scaleForReadingAge(this.args.station.last.timestamp);
  }

  // Rotate to the wind direction and, when shrinking, scale about the same hub
  // centre so the arrow gets smaller in place instead of drifting off its point.
  get markerTransform() {
    const centre = this.geometry.rotationCentre;
    const angle = this.args.station.last.direction + ARROW_DIRECTION_OFFSET;
    const rotate = `rotate(${angle} ${centre})`;
    const scale = this.markerScale;
    if (scale === 1) {
      return rotate;
    }

    const [cx = 0, cy = 0] = centre.split(' ').map(Number);
    return `${rotate} translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`;
  }

  get buttonClass() {
    const base =
      'block cursor-pointer rounded-full p-1 transition focus:outline-none';

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
    <button
      type="button"
      aria-label={{@station.name}}
      class={{this.buttonClass}}
      data-selected={{if @isSelected "true"}}
      data-station-id={{@station.id}}
      data-test-map-station-marker
      {{on "click" this.handleSelect}}
    >
      <svg
        aria-hidden="true"
        class="h-16 w-16 overflow-visible"
        viewBox={{this.viewBox}}
      >
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
    </button>
  </template>
}
