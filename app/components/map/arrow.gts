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
          <svg version="1.1" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" viewBox="-150 -70 340 140" fill="currentColor">
            <path d="M20,67.1C48.9,58.5,70,31.7,70,0S48.9-58.5,20-67.1V-150h-40v82.9C-48.9-58.5-70-31.7-70,0s21.1,58.5,50,67.1V115l-50-25L0,190L70,90l-50,25V67.1z M-35,0c0-19.3,15.7-35,35-35S35-19.3,35,0S19.3,35,0,35S-35,19.3-35,0z" transform="rotate(-90)" />
          </svg>
        </div>`,
    });
  }

  <template>{{yield this.icon}}</template>
}
