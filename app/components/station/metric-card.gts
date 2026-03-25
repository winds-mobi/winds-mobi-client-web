import Component from '@glimmer/component';
import { service } from '@ember/service';
import type { IntlService } from 'ember-intl';
import azimuthToCardinal from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';

type MetricValue = number | string | null | undefined;
type StationMetricFormat =
  | 'azimuth'
  | 'humidity'
  | 'integer'
  | 'litersPerSecond'
  | 'pressure'
  | 'rainfall'
  | 'temperature'
  | 'windSpeed';

export interface StationMetricCardSignature {
  Args: {
    format?: StationMetricFormat;
    label: string;
    labelClass?: string;
    value?: MetricValue;
    valueClass?: string;
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
  @service declare intl: IntlService;

  get hasValue() {
    return hasDisplayableValue(this.args.value);
  }

  get numericValue() {
    return typeof this.args.value === 'number' ? this.args.value : 0;
  }

  get formattedValue() {
    switch (this.args.format) {
      case 'azimuth':
        return `${azimuthToCardinal(this.numericValue)} ${this.intl.t(
          'format.azimuth',
          {
            azimuth: this.numericValue,
          }
        )}`;
      case 'humidity':
      case 'integer':
      case 'litersPerSecond':
      case 'temperature':
      case 'windSpeed':
        return this.intl.formatNumber(this.numericValue, {
          format: this.args.format,
        });
      case 'pressure':
        return this.intl.t('format.pressure', {
          value: this.intl.formatNumber(this.numericValue, {
            format: 'integer',
          }),
        });
      case 'rainfall':
        return this.intl.t('format.rain', {
          value: this.intl.formatNumber(this.numericValue, {
            format: 'rainfall',
          }),
        });
      default:
        return `${this.args.value ?? ''}`;
    }
  }

  <template>
    {{#if this.hasValue}}
      <div
        class="rounded-md bg-slate-50 px-2 py-1.5 ring-1 ring-slate-200/80 md:rounded-xl md:px-3 md:py-2.5"
        ...attributes
      >
        <dt
          class="text-[9px] font-medium leading-tight text-slate-500 md:text-[11px]
            {{if @labelClass @labelClass}}"
        >
          {{@label}}
        </dt>
        <dd
          class="mt-0.5 text-[13px] font-semibold leading-tight md:mt-1.5 md:text-base
            {{if @valueClass @valueClass}}"
        >
          {{this.formattedValue}}
        </dd>
      </div>
    {{/if}}
  </template>
}
