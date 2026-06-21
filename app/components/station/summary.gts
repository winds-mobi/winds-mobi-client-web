import Component from '@glimmer/component';
import { service } from '@ember/service';
import { t } from 'ember-intl';
import type { IntlService } from 'ember-intl';
import CloudRain from 'ember-phosphor-icons/components/ph-cloud-rain';
import Drop from 'ember-phosphor-icons/components/ph-drop';
import Gauge from 'ember-phosphor-icons/components/ph-gauge';
import Thermometer from 'ember-phosphor-icons/components/ph-thermometer';
import { temperatureToTextClass } from 'winds-mobi-client-web/helpers/temperature-to-colour';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';
import StationLastHour from './last-hour';
import StationMetricCard from './metric-card';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import StationSectionCard from './section-card';

function hasValue(value: number | undefined): value is number {
  return Number.isFinite(value);
}

export interface StationSummarySignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationSummary extends Component<StationSummarySignature> {
  @service declare intl: IntlService;

  get reading() {
    return this.args.station.last;
  }

  get speedValueClass() {
    return windToTextClass(this.reading.speed);
  }

  get gustsValueClass() {
    return windToTextClass(this.reading.gusts);
  }

  get temperatureValueClass() {
    return temperatureToTextClass(this.reading.temperature);
  }

  get hasTemperature() {
    return hasValue(this.reading.temperature);
  }

  get hasHumidity() {
    return hasValue(this.reading.humidity);
  }

  get hasPressure() {
    return hasValue(this.reading.pressure);
  }

  get hasRain() {
    return hasValue(this.reading.rain);
  }

  get temperatureLabel() {
    return this.hasTemperature
      ? this.intl.formatNumber(this.reading.temperature, {
          format: 'integer',
        })
      : undefined;
  }

  get humidityLabel() {
    return this.hasHumidity
      ? this.intl.formatNumber(this.reading.humidity, { format: 'integer' })
      : undefined;
  }

  get pressureLabel() {
    return this.hasPressure
      ? this.intl.formatNumber(this.reading.pressure, { format: 'integer' })
      : undefined;
  }

  get rainLabel() {
    return this.hasRain
      ? this.intl.formatNumber(this.reading.rain, { format: 'rainfall' })
      : undefined;
  }

  <template>
    <section data-test-station-summary-section>
      <div class="grid grid-cols-2 items-stretch gap-1.5 md:gap-3">
        <StationSectionCard @title={{t "station.summary.now"}}>
          <dl class="m-0 grid gap-2 md:gap-3">
            <StationMetricCard
              @format="windSpeed"
              @label={{t "wind.speed"}}
              @value={{this.reading.speed}}
              @valueClass={{this.speedValueClass}}
            />

            <StationMetricCard
              @format="windSpeed"
              @label={{t "wind.gusts"}}
              @value={{this.reading.gusts}}
              @valueClass={{this.gustsValueClass}}
            />

            <StationMetricCard
              @format="azimuth"
              @label={{t "wind.direction"}}
              @value={{this.reading.direction}}
            />
          </dl>

          <dl
            class="m-0 mt-2 flex items-baseline justify-between text-base font-semibold md:mt-3 md:text-lg"
          >
            {{#if this.hasTemperature}}
              <dt class="sr-only">{{t "air.temperature"}}</dt>
              <dd
                class="m-0 flex items-baseline gap-0.5"
                title={{t "air.temperature"}}
              >
                <Thermometer class="text-black" />
                <span
                  class={{this.temperatureValueClass}}
                >{{this.temperatureLabel}}</span>
                <span
                  class="text-[0.5em] font-normal text-slate-500"
                >&deg;C</span>
              </dd>
            {{/if}}

            {{#if this.hasHumidity}}
              <dt class="sr-only">{{t "air.humidity"}}</dt>
              <dd
                class="m-0 flex items-baseline gap-0.5"
                title={{t "air.humidity"}}
              >
                <Drop class="text-black" />
                <span>{{this.humidityLabel}}</span>
                <span class="text-[0.5em] font-normal text-slate-500">%</span>
              </dd>
            {{/if}}

            {{#if this.hasPressure}}
              <dt class="sr-only">{{t "air.pressure"}}</dt>
              <dd
                class="m-0 flex items-baseline gap-0.5"
                title={{t "air.pressure"}}
              >
                <Gauge class="text-black" />
                <span>{{this.pressureLabel}}</span>
                <span class="text-[0.5em] font-normal text-slate-500">hPa</span>
              </dd>
            {{/if}}

            {{#if this.hasRain}}
              <dt class="sr-only">{{t "air.rain"}}</dt>
              <dd
                class="m-0 flex items-baseline gap-0.5"
                title={{t "air.rain"}}
              >
                <CloudRain class="text-black" />
                <span>{{this.rainLabel}}</span>
                <span
                  class="text-[0.5em] font-normal text-slate-500"
                >l/m&sup2;</span>
              </dd>
            {{/if}}
          </dl>
        </StationSectionCard>

        <StationLastHour @stationId={{@station.id}} />
      </div>
    </section>
  </template>
}
