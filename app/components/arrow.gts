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
      html: `<div class="w-full h-full" style="transform: rotate(${this.args.rotate}deg)">










      <svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
	 class="w-full h-full ${avg}" viewBox="0 0 416.979 416.979"
	 xml:space="preserve">
<g>
	<path d="M208.489,416.979c115.146,0,208.49-93.344,208.49-208.489C416.979,93.344,323.635,0,208.489,0S0,93.343,0,208.489
		C0,323.635,93.343,416.979,208.489,416.979z M127.24,219.452l68.259-118.21c2.68-4.641,7.632-7.499,12.99-7.499
		s10.31,2.858,12.99,7.499l68.258,118.21c2.682,4.642,2.682,10.359,0.002,15c-2.68,4.642-7.631,7.501-12.99,7.501h-33.26v66.282
		c0,8.284-6.715,15-15,15h-40c-8.284,0-15-6.716-15-15v-66.282H140.23c-5.359,0-10.312-2.859-12.991-7.501
		C124.56,229.812,124.56,224.094,127.24,219.452z"/>
</g>
</svg>


      </div>`,
    });
  }

  <template>{{yield this.icon}}</template>
}
