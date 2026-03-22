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
        'flex h-full flex-col rounded-lg border border-slate-200 bg-white p-2.5 md:rounded-2xl md:p-3.5'
        'flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-3.5'
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
      class="{{if @compact 'mt-2 flex-1 md:mt-3' 'mt-3 flex-1'}}
        {{if @contentClass @contentClass}}"
    >
      {{yield}}
    </div>
  </section>
</template>
