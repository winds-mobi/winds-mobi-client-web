import Component from '@glimmer/component';
import { action } from '@ember/object';
import { on } from '@ember/modifier';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { Station } from 'winds-mobi-client-web/services/store';

// Two whole-marker shapes that share a circular hub: regular stations get the
// rounded-shoulder arrow; peaks get the v1 "star"-shouldered arrow so they read
// as a different shape on the map (echoing the round/triangle distinction of the
// v1 map). Each shape has its own viewBox; both are 340 units tall so they render
// at the same on-screen size, and each rotates around its own viewBox centre.
const STATION_ARROW_PATH =
  'M -60,147.1 C -31.1,138.5 -10,111.7 -10,80 -10,48.3 -31.1,21.5 -60,12.9 V -70 h -40 v 82.9 c -28.9,8.6 -50,35.4 -50,67.1 0,31.7 21.1,58.5 50,67.1 V 195 l -50,-25 70,100 70,-100 -50,25 z M -115,80 c 0,-19.3 15.7,-35 35,-35 19.3,0 35,15.7 35,35 0,19.3 -15.7,35 -35,35 -19.3,0 -35,-15.7 -35,-35 z';
const STATION_ARROW_VIEW_BOX = '-150 -70 140 340';
const STATION_ARROW_ROTATION_CENTRE = '-80 100';
const STATION_PEAK_ARROW_PATH =
  'M20,67.4L88.3-51H20v-99h-40v99h-68.3L-20,67.4V115l-50-25L0,190L70,90l-50,25V67.4z M-35,0c0-19.3,15.7-35,35-35S35-19.3,35,0S19.3,35,0,35S-35,19.3-35,0z';
const STATION_PEAK_ARROW_VIEW_BOX = '-89 -150 178 340';
const STATION_PEAK_ARROW_ROTATION_CENTRE = '0 20';
const STALE_READING_THRESHOLD = 24 * 60 * 60 * 1000;
const STALE_STATION_COLOUR = 'rgb(148, 163, 184)';
// The arrow carries two readings as a double outline: the gusts colour is the
// visible outline, drawn over a slightly wider black stroke. SVG strokes are
// single-valued and centred, so the path is rendered twice in the same rotation
// group — black underneath, gusts on top — leaving a thin black rim beyond the
// gusts ring for contrast against the map.
const MARKER_CONTRAST_OUTLINE_COLOUR = 'rgb(0, 0, 0)';
const MARKER_CONTRAST_OUTLINE_WIDTH = '32';
const MARKER_GUSTS_OUTLINE_WIDTH = '16';

export interface MapStationMarkerSignature {
  Args: {
    isSelected?: boolean;
    onSelect: (stationId: string) => void;
    station: Station;
  };
  Element: HTMLButtonElement;
}

export default class MapStationMarker extends Component<MapStationMarkerSignature> {
  get arrowPath() {
    return this.args.station.isPeak
      ? STATION_PEAK_ARROW_PATH
      : STATION_ARROW_PATH;
  }

  get viewBox() {
    return this.args.station.isPeak
      ? STATION_PEAK_ARROW_VIEW_BOX
      : STATION_ARROW_VIEW_BOX;
  }

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
    const centre = this.args.station.isPeak
      ? STATION_PEAK_ARROW_ROTATION_CENTRE
      : STATION_ARROW_ROTATION_CENTRE;

    return `rotate(${this.args.station.last.direction} ${centre})`;
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
        viewBox={{this.viewBox}}
      >
        <g transform={{this.rotationTransform}}>
          {{! Black under-stroke: a thin rim peeks beyond the gusts outline. }}
          <path
            d={{this.arrowPath}}
            fill={{this.markerColor}}
            stroke={{MARKER_CONTRAST_OUTLINE_COLOUR}}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={{MARKER_CONTRAST_OUTLINE_WIDTH}}
          />
          {{! Gusts-coloured outline on top, plus the wind-speed fill. }}
          <path
            d={{this.arrowPath}}
            fill={{this.markerColor}}
            stroke={{this.gustsColor}}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={{MARKER_GUSTS_OUTLINE_WIDTH}}
          />
        </g>
      </svg>
    </button>
  </template>
}
