import Component from '@glimmer/component';
import { t } from 'ember-intl';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';
import StationMetricCard from './metric-card';
import type { History, Station } from 'winds-mobi-client-web/services/store.js';
import StationSectionCard from './section-card';
import WindDirection from './wind-direction';

export interface StationSummarySignature {
  Args: {
    history: History[];
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const DURATION = 1 * 60 * 60;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export default class StationSummary extends Component<StationSummarySignature> {
  get reading() {
    return this.args.station.last;
  }

  get recentHistory() {
    const latestTimestamp = Math.max(
      ...this.args.history.map((record) => record.timestamp)
    );

    if (!Number.isFinite(latestTimestamp)) {
      return [];
    }

    const minTimestamp = latestTimestamp - DURATION * 1000;

    return this.args.history.filter(
      (record) => record.timestamp >= minTimestamp
    );
  }

  get lastHourSpeeds() {
    const speeds = this.recentHistory
      .map((record) => record.speed)
      .filter(isFiniteNumber);

    if (speeds.length > 0) {
      return speeds;
    }

    return isFiniteNumber(this.reading.speed) ? [this.reading.speed] : [];
  }

  get lastHourMinimumSpeed() {
    return this.lastHourSpeeds.length > 0
      ? Math.min(...this.lastHourSpeeds)
      : undefined;
  }

  get lastHourMeanSpeed() {
    return this.lastHourSpeeds.length > 0
      ? this.lastHourSpeeds.reduce((sum, speed) => sum + speed, 0) /
          this.lastHourSpeeds.length
      : undefined;
  }

  get lastHourMaximumSpeed() {
    return this.lastHourSpeeds.length > 0
      ? Math.max(...this.lastHourSpeeds)
      : undefined;
  }

  valueClassForWindSpeed(speed: number | undefined) {
    return isFiniteNumber(speed) ? windToTextClass(speed) : undefined;
  }

  get speedValueClass() {
    return this.valueClassForWindSpeed(this.reading.speed);
  }

  get gustsValueClass() {
    return this.valueClassForWindSpeed(this.reading.gusts);
  }

  get lastHourMaximumValueClass() {
    return this.valueClassForWindSpeed(this.lastHourMaximumSpeed);
  }

  get lastHourMeanValueClass() {
    return this.valueClassForWindSpeed(this.lastHourMeanSpeed);
  }

  get lastHourMinimumValueClass() {
    return this.valueClassForWindSpeed(this.lastHourMinimumSpeed);
  }

  <template>
    <section
      data-test-station-summary-section
      class="px-2.5 py-2 md:px-5 md:py-4"
    >
      <div
        class="grid grid-cols-[minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,1.1fr)] items-stretch gap-1.5 md:gap-3"
      >
        <StationSectionCard
          @title={{t "station.summary.wind"}}
          @compact={{true}}
          class="min-w-0 h-full"
        >
          <dl class="m-0 space-y-1.5 md:space-y-2.5">
            <StationMetricCard
              @compact={{true}}
              @format="windSpeed"
              @label={{t "wind.speed"}}
              @value={{this.reading.speed}}
              @valueClass={{this.speedValueClass}}
            />

            <StationMetricCard
              @compact={{true}}
              @format="windSpeed"
              @label={{t "wind.gusts"}}
              @value={{this.reading.gusts}}
              @valueClass={{this.gustsValueClass}}
            />

            <StationMetricCard
              @compact={{true}}
              @format="azimuth"
              @label={{t "wind.direction"}}
              @value={{this.reading.direction}}
            />
          </dl>
        </StationSectionCard>

        <StationSectionCard
          @title={{t "station.summary.air"}}
          @compact={{true}}
          class="min-w-0 h-full"
        >
          <dl class="m-0 space-y-1.5 md:space-y-2.5">
            <StationMetricCard
              @compact={{true}}
              @format="temperature"
              @label={{t "air.temperature"}}
              @value={{this.reading.temperature}}
            />

            <StationMetricCard
              @compact={{true}}
              @format="humidity"
              @label={{t "air.humidity"}}
              @value={{this.reading.humidity}}
            />

            <StationMetricCard
              @compact={{true}}
              @format="pressure"
              @label={{t "air.pressure"}}
              @value={{this.reading.pressure}}
            />

            <StationMetricCard
              @compact={{true}}
              @format="rainfall"
              @label={{t "air.rain"}}
              @value={{this.reading.rain}}
            />
          </dl>
        </StationSectionCard>

        <StationSectionCard
          @title={{t "wind.lastHour"}}
          @compact={{true}}
          class="min-w-0 h-full"
        >
          <div class="grid gap-2 md:gap-3">
            <div class="min-w-0 w-full aspect-square">
              <WindDirection @data={{this.recentHistory}} />
            </div>

            <dl class="m-0 grid gap-1 md:gap-2">
              <StationMetricCard
                @compact={{true}}
                @format="windSpeed"
                @label={{t "wind.maximum"}}
                @value={{this.lastHourMaximumSpeed}}
                @valueClass={{this.lastHourMaximumValueClass}}
              />

              <StationMetricCard
                @compact={{true}}
                @format="windSpeed"
                @label={{t "wind.mean"}}
                @value={{this.lastHourMeanSpeed}}
                @valueClass={{this.lastHourMeanValueClass}}
              />

              <StationMetricCard
                @compact={{true}}
                @format="windSpeed"
                @label={{t "wind.minimum"}}
                @value={{this.lastHourMinimumSpeed}}
                @valueClass={{this.lastHourMinimumValueClass}}
              />
            </dl>
          </div>
        </StationSectionCard>
      </div>
    </section>
  </template>
}
