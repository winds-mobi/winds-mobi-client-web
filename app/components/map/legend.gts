import Component from '@glimmer/component';

export interface WindLegendBand {
  color: string;
  label: string;
}

export interface MapLegendSignature {
  Args: {
    bands: WindLegendBand[];
    title: string;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLElement;
}

export default class MapLegend extends Component<MapLegendSignature> {
  rowStyle(band: WindLegendBand) {
    return `background-color: ${band.color};`;
  }

  <template>
    <aside
      class="pointer-events-none absolute left-4 top-4 z-10 w-16 rounded-xl border border-slate-200 bg-white/92 px-1 py-1 shadow-lg shadow-slate-900/10 backdrop-blur"
      data-test-map-wind-legend
    >
      <p
        class="text-[8px] font-semibold uppercase leading-tight tracking-[0.12em] text-slate-500"
      >
        {{@title}}
      </p>

      <ul class="mt-0.5 space-y-0.5">
        {{#each @bands as |band|}}
          <li
            class="rounded-sm px-1 py-px text-[9px] font-semibold leading-tight text-white shadow-inner shadow-black/10"
            style={{this.rowStyle band}}
          >
            {{band.label}}
          </li>
        {{/each}}
      </ul>
    </aside>
  </template>
}
