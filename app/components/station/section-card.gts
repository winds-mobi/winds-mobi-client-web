export interface StationSectionCardSignature {
  Args: {
    compact?: boolean;
    contentClass?: string;
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
    class="{{if
        @compact
        'rounded-lg border border-slate-200 bg-white p-2.5 md:rounded-2xl md:p-3.5'
        'rounded-2xl border border-slate-200 bg-white p-3.5'
      }}"
    ...attributes
  >
    <p
      class="{{if
          @compact
          'text-[9px] tracking-[0.12em] md:text-[11px] md:tracking-[0.16em]'
          'text-[11px] tracking-[0.16em]'
        }}
        font-semibold uppercase text-slate-500
        {{if @titleClass @titleClass}}"
    >
      {{@title}}
    </p>

    <div
      class="{{if @compact 'mt-2 md:mt-3' 'mt-3'}}
        {{if @contentClass @contentClass}}"
    >
      {{yield}}
    </div>
  </section>
</template>
