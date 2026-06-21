import Component from '@glimmer/component';
import { service } from '@ember/service';
import type { IntlService } from 'ember-intl';
import azimuthToCardinal from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import type { IconComponent } from 'winds-mobi-client-web/utils/icon-component';

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
    // When given, the icon replaces the visible label (kept sr-only for
    // screen readers); the card otherwise keeps its usual full-width layout.
    icon?: IconComponent;
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
        class="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-base font-semibold ring-1 ring-slate-200/80 md:rounded-xl md:px-3 md:py-2.5 md:text-lg"
        ...attributes
      >
        {{#if @icon}}
          <dt class="sr-only">{{@label}}</dt>
          <@icon class="text-black" />
        {{else}}
          <dt
            class="text-[11px] font-medium leading-tight text-slate-500 md:text-xs
              {{if @labelClass @labelClass}}"
          >
            {{@label}}
          </dt>
        {{/if}}
        <dd class="text-right leading-tight {{if @valueClass @valueClass}}">
          {{this.formattedValue}}
        </dd>
      </div>
    {{/if}}
  </template>
}
