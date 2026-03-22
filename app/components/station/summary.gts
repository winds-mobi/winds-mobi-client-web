import Component from '@glimmer/component';
import { t } from 'ember-intl';
import azimuthToCardinal from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';
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

  get directionCardinal() {
    return azimuthToCardinal(this.reading.direction);
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

  styleForWindSpeed(speed: number | undefined) {
    return isFiniteNumber(speed) ? `color: ${windToColour(speed)};` : undefined;
  }

  get speedStyle() {
    return this.styleForWindSpeed(this.reading.speed);
  }

  get gustsStyle() {
    return this.styleForWindSpeed(this.reading.gusts);
  }

  get lastHourMaximumStyle() {
    return this.styleForWindSpeed(this.lastHourMaximumSpeed);
  }

  get lastHourMeanStyle() {
    return this.styleForWindSpeed(this.lastHourMeanSpeed);
  }

  get lastHourMinimumStyle() {
    return this.styleForWindSpeed(this.lastHourMinimumSpeed);
  }

  <template>
    <section data-test-station-summary-section class="px-2.5 py-2 md:px-5 md:py-4">
      <div class="grid grid-cols-2 items-start gap-2 md:grid-cols-1 md:gap-3">
        <div class="grid min-w-0 gap-2 md:grid-cols-2 md:gap-3">
          <StationSectionCard @title={{t "station.summary.wind"}} @compact={{true}}>
            <dl class="m-0 space-y-1.5 md:space-y-2.5">
              <StationMetricCard
                @compact={{true}}
                @label={{t "wind.speed"}}
                @unit="kilometer-per-hour"
                @value={{this.reading.speed}}
                @valueStyle={{this.speedStyle}}
              />

              <StationMetricCard
                @compact={{true}}
                @label={{t "wind.gusts"}}
                @unit="kilometer-per-hour"
                @value={{this.reading.gusts}}
                @valueStyle={{this.gustsStyle}}
              />

              <StationMetricCard
                @compact={{true}}
                @label={{t "wind.direction"}}
                @value={{this.reading.direction}}
              >
                {{this.directionCardinal}}
                {{t "format.azimuth" azimuth=this.reading.direction}}
              </StationMetricCard>
            </dl>
          </StationSectionCard>

          <StationSectionCard @title={{t "station.summary.air"}} @compact={{true}}>
            <dl class="m-0 space-y-1.5 md:space-y-2.5">
              <StationMetricCard
                @compact={{true}}
                @label={{t "air.temperature"}}
                @unit="celsius"
                @value={{this.reading.temperature}}
              />

              <StationMetricCard
                @compact={{true}}
                @formattedValue={{t
                  "format.relativeHumidity"
                  value=this.reading.humidity
                }}
                @label={{t "air.humidity"}}
                @value={{this.reading.humidity}}
              />

              <StationMetricCard
                @compact={{true}}
                @formattedValue={{t "format.pressure" value=this.reading.pressure}}
                @label={{t "air.pressure"}}
                @value={{this.reading.pressure}}
              />

              <StationMetricCard
                @compact={{true}}
                @formattedValue={{t "format.rain" value=this.reading.rain}}
                @label={{t "air.rain"}}
                @value={{this.reading.rain}}
              />
            </dl>
          </StationSectionCard>
        </div>

        <StationSectionCard
          @title={{t "wind.lastHour"}}
          @compact={{true}}
          class="min-w-0"
        >
          <div
            class="grid gap-2 md:grid-cols-[minmax(0,1fr)_12rem] md:items-stretch md:gap-3"
          >
            <div class="min-w-0 h-28 md:h-full">
              <WindDirection @data={{this.recentHistory}} />
            </div>

            <dl class="m-0 grid gap-1 md:gap-2">
              <StationMetricCard
                @compact={{true}}
                @label={{t "wind.maximum"}}
                @unit="kilometer-per-hour"
                @value={{this.lastHourMaximumSpeed}}
                @valueStyle={{this.lastHourMaximumStyle}}
              />

              <StationMetricCard
                @compact={{true}}
                @label={{t "wind.mean"}}
                @unit="kilometer-per-hour"
                @value={{this.lastHourMeanSpeed}}
                @valueStyle={{this.lastHourMeanStyle}}
              />

              <StationMetricCard
                @compact={{true}}
                @label={{t "wind.minimum"}}
                @unit="kilometer-per-hour"
                @value={{this.lastHourMinimumSpeed}}
                @valueStyle={{this.lastHourMinimumStyle}}
              />
            </dl>
          </div>
        </StationSectionCard>
      </div>
    </section>
  </template>
}
