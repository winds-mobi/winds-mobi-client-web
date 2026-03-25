import Component from '@glimmer/component';
import { action } from '@ember/object';
import { on } from '@ember/modifier';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { Station } from 'winds-mobi-client-web/services/store';

const STATION_ARROW_PATH =
  'M -60,147.1 C -31.1,138.5 -10,111.7 -10,80 -10,48.3 -31.1,21.5 -60,12.9 V -70 h -40 v 82.9 c -28.9,8.6 -50,35.4 -50,67.1 0,31.7 21.1,58.5 50,67.1 V 195 l -50,-25 70,100 70,-100 -50,25 z M -115,80 c 0,-19.3 15.7,-35 35,-35 19.3,0 35,15.7 35,35 0,19.3 -15.7,35 -35,35 -19.3,0 -35,-15.7 -35,-35 z';
const STALE_READING_THRESHOLD = 24 * 60 * 60 * 1000;
const STALE_STATION_COLOUR = 'rgb(148, 163, 184)';
const MARKER_STROKE_WIDTH = '16';

export interface MapStationMarkerSignature {
  Args: {
    onSelect: (stationId: string) => void;
    station: Station;
  };
  Blocks: {
    default: [];
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

  get markerOutlineColor() {
    return this.colourForWindReading(this.args.station.last.gusts);
  }

  get rotationTransform() {
    return `rotate(${this.args.station.last.direction} -80 100)`;
  }

  @action
  handleSelect() {
    this.args.onSelect(this.args.station.id);
  }

  <template>
    <button
      type="button"
      aria-label={{@station.name}}
      class="cursor-pointer rounded-full p-0.5 focus:outline-none"
      data-station-id={{@station.id}}
      data-test-map-station-marker
      {{on "click" this.handleSelect}}
    >
      <svg
        aria-hidden="true"
        class="h-10 w-10 overflow-visible drop-shadow-[0_3px_6px_rgba(15,23,42,0.28)]"
        viewBox="-150 -70 140 340"
      >
        <path
          d={{this.arrowPath}}
          fill={{this.markerColor}}
          stroke={{this.markerOutlineColor}}
          stroke-alignment="outer"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width={{MARKER_STROKE_WIDTH}}
          transform={{this.rotationTransform}}
        />
      </svg>
    </button>
  </template>
}
