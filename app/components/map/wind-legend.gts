import Component from '@glimmer/component';
import { t } from 'ember-intl';
import {
  WIND_COLOUR_BANDS,
  type WindColourBand,
} from 'winds-mobi-client-web/helpers/wind-to-colour';

interface WindLegendBand extends WindColourBand {
  label: string;
  swatchStyle: string;
}

export interface MapWindLegendSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class MapWindLegend extends Component<MapWindLegendSignature> {
  get bands(): WindLegendBand[] {
    return WIND_COLOUR_BANDS.map((band) => ({
      ...band,
      label: Number.isFinite(band.max) ? `${band.max}` : `${band.min}+`,
      swatchStyle: `background-color: ${band.color};`,
    }));
  }

  <template>
    <aside
      data-test-map-wind-legend
      class="pointer-events-none absolute right-4 top-4 z-10 w-20 rounded-2xl border border-slate-200 bg-white/92 px-2.5 py-2 shadow-lg shadow-slate-900/10 backdrop-blur"
    >
      <p
        class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"
      >
        {{t "map.legend.windSpeed"}}
      </p>

      <ul class="mt-2 space-y-1">
        {{#each this.bands as |band|}}
          <li class="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
            <span
              class="h-2 w-2 shrink-0 rounded-full ring-1 ring-slate-300/80"
              style={{band.swatchStyle}}
            ></span>
            <span>{{band.label}}</span>
          </li>
        {{/each}}
      </ul>
    </aside>
  </template>
}
