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
  get icon() {
    const avg =
      this.bg[Math.floor((this.args.avg / 40) * (this.bg.length - 1))];
    const max =
      this.border[Math.floor((this.args.max / 40) * (this.border.length - 1))];

    return divIcon([], {
      iconUrl: '/images/arrow.png',
      iconSize: [24, 24],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
      html: `<div class="w-full h-full" style="transform: rotate(${this.args.rotate}deg)"><img class="w-full h-full ${avg} ${max} border-2" src="/images/arrow.png" /></div>`,
    });
  }

  <template>{{yield this.icon}}</template>
}
