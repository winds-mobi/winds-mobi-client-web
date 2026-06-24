export interface StationSectionCardSignature {
  Args: {
    title: string;
    titleClass?: string;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLElement;
}

<template>
  <section
    class="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-2.5 md:rounded-2xl md:p-3.5"
    ...attributes
  >
    <p
      class="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 md:text-xs md:tracking-[0.14em]
        {{@titleClass}}"
    >
      {{@title}}
    </p>

    <div class="mt-2 flex-1 md:mt-3">
      {{yield}}
    </div>
  </section>
</template>
