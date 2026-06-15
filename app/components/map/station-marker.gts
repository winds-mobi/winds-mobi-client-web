import Component from '@glimmer/component';
import { action } from '@ember/object';
import { on } from '@ember/modifier';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { Station } from 'winds-mobi-client-web/services/store';

const STATION_ARROW_PATH =
  'M -60,147.1 C -31.1,138.5 -10,111.7 -10,80 -10,48.3 -31.1,21.5 -60,12.9 V -70 h -40 v 82.9 c -28.9,8.6 -50,35.4 -50,67.1 0,31.7 21.1,58.5 50,67.1 V 195 l -50,-25 70,100 70,-100 -50,25 z M -115,80 c 0,-19.3 15.7,-35 35,-35 19.3,0 35,15.7 35,35 0,19.3 -15.7,35 -35,35 -19.3,0 -35,-15.7 -35,-35 z';
const STALE_READING_THRESHOLD = 24 * 60 * 60 * 1000;
const STALE_STATION_COLOUR = 'rgb(148, 163, 184)';
const MARKER_STROKE_WIDTH = '10';
const MARKER_OUTLINE_COLOUR = 'rgba(15, 23, 42, 0.5)';
// The arrow path has a circular hole centred here; a gusts-coloured ring sits over
// the hole edge (in front, rotating with the arrow) so it reads as the gusts colour
// and covers the path's inner outline. Double the arrow's outline thickness.
const MARKER_HUB_X = '-80';
const MARKER_HUB_Y = '80';
const MARKER_HUB_RADIUS = '35';
const MARKER_HUB_STROKE_WIDTH = '20';

export interface MapStationMarkerSignature {
  Args: {
    isSelected?: boolean;
    onSelect: (stationId: string) => void;
    station: Station;
  };
  Element: HTMLButtonElement;
}

export default class MapStationMarker extends Component<MapStationMarkerSignature> {
  arrowPath = STATION_ARROW_PATH;

  private colourForWindReading(speed: number) {
    const { timestamp } = this.args.station.last;

    if (!Number.isFinite(timestamp)) {
      return windToColour(speed);
    }

    return Date.now() - timestamp > STALE_READING_THRESHOLD
      ? STALE_STATION_COLOUR
      : windToColour(speed);
  }

  get markerColor() {
    return this.colourForWindReading(this.args.station.last.speed);
  }

  get gustsColor() {
    return this.colourForWindReading(this.args.station.last.gusts);
  }

  get rotationTransform() {
    return `rotate(${this.args.station.last.direction} -80 100)`;
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
    this.args.onSelect(this.args.station.id);
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
        viewBox="-150 -70 140 340"
      >
        <g transform={{this.rotationTransform}}>
          <path
            d={{this.arrowPath}}
            fill={{this.markerColor}}
            stroke={{MARKER_OUTLINE_COLOUR}}
            stroke-alignment="outer"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={{MARKER_STROKE_WIDTH}}
          />
          <circle
            cx={{MARKER_HUB_X}}
            cy={{MARKER_HUB_Y}}
            r={{MARKER_HUB_RADIUS}}
            fill="none"
            stroke={{this.gustsColor}}
            stroke-width={{MARKER_HUB_STROKE_WIDTH}}
          />
        </g>
      </svg>
    </button>
  </template>
}
