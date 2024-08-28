import Component from '@glimmer/component';
import { divIcon } from 'ember-leaflet/helpers/div-icon';

export interface ArrowSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class Arrow extends Component<ArrowSignature> {
  bg = [
    'bg-red-100',
    'bg-red-200',
    'bg-red-300',
    'bg-red-400',
    'bg-red-500',
    'bg-red-600',
    'bg-red-700',
    'bg-red-800',
    'bg-red-900',
  ];

  border = [
    'border-red-100',
    'border-red-200',
    'border-red-300',
    'border-red-400',
    'border-red-500',
    'border-red-600',
    'border-red-700',
    'border-red-800',
    'border-red-900',
  ];

  arrow = [
    'text-lime-600',
    'text-green-600',
    'text-teal-400',
    'text-cyan-600',
    'text-sky-600',
    'text-blue-700',
    'text-purple-800',
    'text-fuchsia-500',
    'text-red-900',
  ];
  get icon() {
    const avg =
      this.bg[Math.floor((this.args.avg / 40) * (this.bg.length - 1))];
    const max =
      this.border[Math.floor((this.args.max / 40) * (this.border.length - 1))];
    const arrow =
      this.arrow[Math.floor((this.args.avg / 40) * (this.arrow.length - 1))];

    return divIcon([], {
      iconUrl: '/images/arrow.png',
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -14],
      html: `<div class="flex w-full h-full ${arrow}" style="transform: rotate(${
        this.args.rotate + 90
      }deg); fill: currentColor">







<svg version="1.1" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" viewBox="-150 -70 340 140" fill="currentColor">
    <path d="M20,67.1C48.9,58.5,70,31.7,70,0S48.9-58.5,20-67.1V-150h-40v82.9C-48.9-58.5-70-31.7-70,0s21.1,58.5,50,67.1V115l-50-25L0,190L70,90l-50,25V67.1z M-35,0c0-19.3,15.7-35,35-35S35-19.3,35,0S19.3,35,0,35S-35,19.3-35,0z" transform="rotate(-90)" />
</svg>




      </div>`,
    });
  }

  <template>{{yield this.icon}}</template>
}

// TODO: Arrow can't change colour on non-inlined images
// <img src="images/arrow-round-right.svg" />
