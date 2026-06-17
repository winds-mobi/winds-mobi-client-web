import Component from '@glimmer/component';
import {
  colourForWindReading,
  MARKER_BODY_WIDTH,
  MARKER_OUTLINE_WIDTH,
  MARKER_PLAIN_OUTLINE_COLOUR,
  STATION_ARROW_HUB_RADIUS,
  stationArrowGeometry,
} from 'winds-mobi-client-web/utils/station-arrow';

export interface SettingsWindArrowSignature {
  Args: {
    direction: number;
    speed: number;
    gusts: number;
    // When true, and the gusts fall in a different wind band than the average,
    // the hub is recoloured with the gusts colour — mirroring the on-map marker.
    showGusts: boolean;
    // Whole-arrow scale, mirroring the on-map age shrink. Defaults to full size.
    scale?: number;
  };
  Element: SVGSVGElement;
}

// Presentational copy of the on-map station arrow used to give the settings
// page a live preview. It deliberately mirrors [map/station-marker.gts]: the
// same geometry, a plain black hairline outline, and a gusts-coloured disc
// behind the arrow (shown through the hub hole) when the gusts band differs. The
// reading is a fixed sample (now-dated, so colours are never the stale grey).
export default class SettingsWindArrow extends Component<SettingsWindArrowSignature> {
  geometry = stationArrowGeometry(false);

  get markerColor() {
    return colourForWindReading(this.args.speed, Date.now());
  }

  get gustsColor() {
    return colourForWindReading(this.args.gusts, Date.now());
  }

  get showGustsHub() {
    return this.args.showGusts && this.gustsColor !== this.markerColor;
  }

  // Rotate to the wind direction and, when scaled, shrink about the same hub
  // centre so the arrow gets smaller in place — mirroring the on-map marker.
  get markerTransform() {
    const centre = this.geometry.rotationCentre;
    const rotate = `rotate(${this.args.direction} ${centre})`;
    const scale = this.args.scale ?? 1;
    if (scale === 1) {
      return rotate;
    }

    const [cx = 0, cy = 0] = centre.split(' ').map(Number);
    return `${rotate} translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`;
  }

  <template>
    <svg
      aria-hidden="true"
      class="overflow-visible"
      viewBox={{this.geometry.viewBox}}
      ...attributes
    >
      <g transform={{this.markerTransform}}>
        {{#if this.showGustsHub}}
          <circle
            cx={{this.geometry.hubCx}}
            cy={{this.geometry.hubCy}}
            r={{STATION_ARROW_HUB_RADIUS}}
            fill={{this.gustsColor}}
          />
        {{/if}}
        <path
          d={{this.geometry.path}}
          fill="none"
          stroke={{MARKER_PLAIN_OUTLINE_COLOUR}}
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width={{MARKER_OUTLINE_WIDTH}}
        />
        <path
          d={{this.geometry.path}}
          fill={{this.markerColor}}
          stroke={{this.markerColor}}
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width={{MARKER_BODY_WIDTH}}
        />
      </g>
    </svg>
  </template>
}
