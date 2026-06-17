import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import {
  colourForWindReading,
  MARKER_OUTLINE_WIDTH,
  MARKER_PLAIN_OUTLINE_COLOUR,
  opacityForReadingAge,
  STATION_ARROW_HUB_RADIUS,
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

  get rotationTransform() {
    return `rotate(${this.args.station.last.direction} ${this.geometry.rotationCentre})`;
  }

  // Fade the whole arrow (fill + outline) by reading age when the preference is
  // on. Recomputed each refresh cycle as new readings replace the record, so no
  // timer is needed — the data only changes on refresh anyway.
  get markerOpacity() {
    if (!this.settings.fadeOldData) {
      return 1;
    }

    return opacityForReadingAge(this.args.station.last.timestamp);
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
        class="h-14 w-14 overflow-visible"
        viewBox={{this.viewBox}}
      >
        <g opacity={{this.markerOpacity}} transform={{this.rotationTransform}}>
          {{! Gusts band differs: a gusts-coloured disc behind, shown through the hub hole. }}
          {{#if this.showGustsHub}}
            <circle
              cx={{this.geometry.hubCx}}
              cy={{this.geometry.hubCy}}
              r={{STATION_ARROW_HUB_RADIUS}}
              fill={{this.gustsColor}}
            />
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
