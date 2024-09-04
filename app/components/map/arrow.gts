import Component from '@glimmer/component';
// @ts-expect-error
import { divIcon } from 'ember-leaflet/helpers/div-icon';
import windToColour from '../../helpers/wind-to-colour';

export interface ArrowSignature {
  Args: {
    speed: number;
    gusts: number;
  };
  Blocks: {
    default: [typeof divIcon];
  };
  Element: null;
}

export default class Arrow extends Component<ArrowSignature> {
  get icon() {
    const colour = windToColour(this.args.speed);

    return divIcon([], {
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -14],
      html: `
        <div class="flex w-full h-full" style="color: ${colour}; fill: currentColor">
          <svg
            version="1.1"
            viewBox="-150 -70 140 340"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M -60,147.1 C -31.1,138.5 -10,111.7 -10,80 -10,48.3 -31.1,21.5 -60,12.9 V -70 h -40 v 82.9 c -28.9,8.6 -50,35.4 -50,67.1 0,31.7 21.1,58.5 50,67.1 V 195 l -50,-25 70,100 70,-100 -50,25 z M -115,80 c 0,-19.3 15.7,-35 35,-35 19.3,0 35,15.7 35,35 0,19.3 -15.7,35 -35,35 -19.3,0 -35,-15.7 -35,-35 z" />
          </svg>
        </div>`,
    });
  }

  <template>{{yield this.icon}}</template>
}
