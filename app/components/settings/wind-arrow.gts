import Component from '@glimmer/component';
import {
  colourForWindReading,
  MARKER_CONTRAST_OUTLINE_COLOUR,
  MARKER_CONTRAST_OUTLINE_WIDTH,
  MARKER_GUSTS_OUTLINE_WIDTH,
  stationArrowGeometry,
} from 'winds-mobi-client-web/utils/station-arrow';

export interface SettingsWindArrowSignature {
  Args: {
    direction: number;
    speed: number;
    gusts: number;
    // When false the gusts-coloured outline is hidden, leaving the plain
    // black-rimmed wind-speed arrow — mirroring the on-map marker.
    showGusts: boolean;
  };
  Element: SVGSVGElement;
}

// Presentational copy of the on-map station arrow used to give the settings
// page a live preview. It deliberately mirrors [map/station-marker.gts]: the
// same geometry, the black contrast under-stroke, and the gusts outline on top.
// The reading is a fixed sample (now-dated, so colours are never the stale
// grey) since the preview illustrates the toggle, not real data.
export default class SettingsWindArrow extends Component<SettingsWindArrowSignature> {
  geometry = stationArrowGeometry(false);

  get markerColor() {
    return colourForWindReading(this.args.speed, Date.now());
  }

  get gustsColor() {
    return colourForWindReading(this.args.gusts, Date.now());
  }

  get rotationTransform() {
    return `rotate(${this.args.direction} ${this.geometry.rotationCentre})`;
  }

  <template>
    <svg
      aria-hidden="true"
      class="overflow-visible"
      viewBox={{this.geometry.viewBox}}
      ...attributes
    >
      <g transform={{this.rotationTransform}}>
        <path
          d={{this.geometry.path}}
          fill={{this.markerColor}}
          stroke={{MARKER_CONTRAST_OUTLINE_COLOUR}}
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width={{MARKER_CONTRAST_OUTLINE_WIDTH}}
        />
        <path
          d={{this.geometry.path}}
          fill={{this.markerColor}}
          stroke={{if @showGusts this.gustsColor "none"}}
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width={{MARKER_GUSTS_OUTLINE_WIDTH}}
        />
      </g>
    </svg>
  </template>
}
