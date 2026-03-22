export interface StationMetricCardSignature {
  Args: {
    compact?: boolean;
    label: string;
    labelClass?: string;
    valueClass?: string;
    valueStyle?: string;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLElement;
}

<template>
  <div
    class="{{if
        @compact
        'rounded-lg bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200/80 md:rounded-xl md:px-3 md:py-2.5'
        'rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/80'
      }}"
    ...attributes
  >
    <dt
      class="{{if @compact 'text-[10px] md:text-[11px]' 'text-[11px]'}}
        font-medium text-slate-500
        {{if @labelClass @labelClass}}"
    >
      {{@label}}
    </dt>
    <dd
      class="{{if @compact 'mt-1 text-sm md:mt-1.5 md:text-base' 'mt-1.5'}}
        font-semibold {{if @valueClass @valueClass}}"
      style={{@valueStyle}}
    >
      {{yield}}
    </dd>
  </div>
</template>
