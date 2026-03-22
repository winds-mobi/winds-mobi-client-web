export interface StationMetricCardSignature {
  Args: {
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
    class="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/80"
    ...attributes
  >
    <dt
      class="text-[11px] font-medium text-slate-500
        {{if @labelClass @labelClass}}"
    >
      {{@label}}
    </dt>
    <dd
      class="mt-1.5 font-semibold {{if @valueClass @valueClass}}"
      style={{@valueStyle}}
    >
      {{yield}}
    </dd>
  </div>
</template>
