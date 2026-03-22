import Component from '@glimmer/component';
import { formatNumber } from 'ember-intl';

type MetricValue = number | string | null | undefined;

export interface StationMetricCardSignature {
  Args: {
    compact?: boolean;
    formattedValue?: string;
    label: string;
    labelClass?: string;
    unit?: string;
    value?: MetricValue;
    valueClass?: string;
    valueStyle?: string;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLElement;
}

function hasDisplayableValue(value: MetricValue) {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return false;
}

export default class StationMetricCard extends Component<StationMetricCardSignature> {
  get hasValue() {
    return hasDisplayableValue(this.args.value);
  }

  get hasFormattedValue() {
    return hasDisplayableValue(this.args.formattedValue);
  }

  get numericValue() {
    return typeof this.args.value === 'number' ? this.args.value : 0;
  }

<template>
  {{#if this.hasValue}}
    <div
      class="{{if
          @compact
          'rounded-md bg-slate-50 px-2 py-1.5 ring-1 ring-slate-200/80 md:rounded-xl md:px-3 md:py-2.5'
          'rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/80'
        }}"
      ...attributes
    >
      <dt
        class="{{if @compact 'text-[9px] leading-tight md:text-[11px]' 'text-[11px]'}}
          font-medium text-slate-500
          {{if @labelClass @labelClass}}"
      >
        {{@label}}
      </dt>
      <dd
        class="{{if
            @compact
            'mt-0.5 text-[13px] leading-tight md:mt-1.5 md:text-base'
            'mt-1.5'
          }}
          font-semibold {{if @valueClass @valueClass}}"
        style={{@valueStyle}}
      >
        {{#if (has-block)}}
          {{yield}}
        {{else if this.hasFormattedValue}}
          {{@formattedValue}}
        {{else if @unit}}
          {{formatNumber this.numericValue style="unit" unit=@unit}}
        {{else}}
          {{@value}}
        {{/if}}
      </dd>
    </div>
  {{/if}}
</template>
}
