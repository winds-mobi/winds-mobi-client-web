import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import {
  colourForWindReading,
  MARKER_OUTLINE_WIDTH,
  MARKER_PLAIN_OUTLINE_COLOUR,
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

  // Gusts colour when the preference is on, a plain black border otherwise.
  get outlineColor() {
    if (!this.settings.showGustsOutline) {
      return MARKER_PLAIN_OUTLINE_COLOUR;
    }

    const { gusts, timestamp } = this.args.station.last;
    return colourForWindReading(gusts, timestamp);
  }

  get rotationTransform() {
    return `rotate(${this.args.station.last.direction} ${this.geometry.rotationCentre})`;
  }

  get buttonClass() {
    const base =
      'block cursor-pointer rounded-full p-1 transition focus:outline-none';

    // Selected: a grey disc + ring framing the arrow so it stands out on the map.
    return this.args.isSelected
      ? `${base} bg-slate-400/40 ring-2 ring-slate-500/70`
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
      data-station-id={{@station.id}}
      data-test-map-station-marker
      {{on "click" this.handleSelect}}
    >
      <svg
        aria-hidden="true"
        class="h-10 w-10 overflow-visible"
        viewBox={{this.viewBox}}
      >
        <g transform={{this.rotationTransform}}>
          {{! Outline grows outward (paint-order): gusts colour when enabled, plain black otherwise. }}
          <path
            d={{this.arrowPath}}
            fill={{this.markerColor}}
            paint-order="stroke"
            stroke={{this.outlineColor}}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={{MARKER_OUTLINE_WIDTH}}
          />
        </g>
      </svg>
    </button>
  </template>
}
