import Component from '@glimmer/component';
import {
  colourForWindReading,
  MARKER_OUTLINE_WIDTH,
  MARKER_PLAIN_OUTLINE_COLOUR,
  stationArrowGeometry,
} from 'winds-mobi-client-web/utils/station-arrow';

export interface SettingsWindArrowSignature {
  Args: {
    direction: number;
    speed: number;
    gusts: number;
    // When false the outline is a plain black border; when true it takes the
    // gusts-speed colour — mirroring the on-map marker.
    showGusts: boolean;
    // Whole-arrow opacity, mirroring the on-map age fade. Defaults to opaque.
    opacity?: number;
  };
  Element: SVGSVGElement;
}

// Presentational copy of the on-map station arrow used to give the settings
// page a live preview. It deliberately mirrors [map/station-marker.gts]: the
// same geometry and the single hairline outline that takes the gusts colour or
// plain black. The reading is a fixed sample (now-dated, so colours are never
// the stale grey) since the preview illustrates the toggle, not real data.
export default class SettingsWindArrow extends Component<SettingsWindArrowSignature> {
  geometry = stationArrowGeometry(false);

  get markerColor() {
    return colourForWindReading(this.args.speed, Date.now());
  }

  get outlineColor() {
    return this.args.showGusts
      ? colourForWindReading(this.args.gusts, Date.now())
      : MARKER_PLAIN_OUTLINE_COLOUR;
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
      <g
        opacity={{if @opacity @opacity 1}}
        transform={{this.rotationTransform}}
      >
        <path
          d={{this.geometry.path}}
          fill={{this.markerColor}}
          paint-order="stroke"
          stroke={{this.outlineColor}}
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width={{MARKER_OUTLINE_WIDTH}}
        />
      </g>
    </svg>
  </template>
}
