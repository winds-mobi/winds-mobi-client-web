export interface WindLegendBand {
  backgroundClass: string;
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

<template>
  <aside
    class="inline-flex max-w-[min(22rem,calc(100vw-1.25rem))] flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white/92 px-1 py-1 shadow-lg shadow-slate-900/10 backdrop-blur"
    data-test-map-wind-legend
    ...attributes
  >
    <p
      class="shrink-0 text-[7px] font-semibold uppercase leading-tight tracking-[0.1em] text-slate-500"
    >
      {{@title}}
    </p>

    <ul class="flex flex-wrap gap-0.5">
      {{#each @bands as |band|}}
        <li
          class="rounded-sm px-0.75 py-px text-[8px] font-semibold leading-tight whitespace-nowrap text-white shadow-inner shadow-black/10
            {{band.backgroundClass}}"
        >
          {{band.label}}
        </li>
      {{/each}}
    </ul>
  </aside>
</template>
