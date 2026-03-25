import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { t } from 'ember-intl';
import StationMetricCard from './metric-card';
import type { History } from 'winds-mobi-client-web/services/store.js';
import WindDirection from './wind-direction';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';
import { sortByNumericValue } from 'winds-mobi-client-web/utils/chart-series';

export interface StationLastHourContentSignature {
  Args: {
    history: History[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationLastHourContent extends Component<StationLastHourContentSignature> {
  @cached
  get lastHourHistory() {
    return sortByNumericValue(this.args.history, (record) => record.timestamp);
  }

  @cached
  get lastHourSpeeds() {
    return this.lastHourHistory.map((record) => record.speed);
  }

  get hasHistory() {
    return this.lastHourHistory.length > 0;
  }

  get lastHourMinimumSpeed() {
    return this.hasHistory ? Math.min(...this.lastHourSpeeds) : undefined;
  }

  get lastHourMeanSpeed() {
    if (!this.hasHistory) {
      return undefined;
    }

    if (this.lastHourHistory.length === 1) {
      return this.lastHourHistory[0]?.speed;
    }

    let weightedSpeedSum = 0;
    let totalDuration = 0;

    for (let index = 0; index < this.lastHourHistory.length - 1; index++) {
      const currentRecord = this.lastHourHistory[index];
      const nextRecord = this.lastHourHistory[index + 1];

      if (!currentRecord || !nextRecord) {
        continue;
      }

      const duration = nextRecord.timestamp - currentRecord.timestamp;

      weightedSpeedSum += currentRecord.speed * duration;
      totalDuration += duration;
    }

    return totalDuration > 0
      ? weightedSpeedSum / totalDuration
      : this.lastHourHistory[this.lastHourHistory.length - 1]?.speed;
  }

  get lastHourMaximumSpeed() {
    return this.hasHistory ? Math.max(...this.lastHourSpeeds) : undefined;
  }

  get lastHourMaximumValueClass() {
    return this.hasHistory
      ? windToTextClass(this.lastHourMaximumSpeed)
      : undefined;
  }

  get lastHourMeanValueClass() {
    return this.hasHistory
      ? windToTextClass(this.lastHourMeanSpeed)
      : undefined;
  }

  get lastHourMinimumValueClass() {
    return this.hasHistory
      ? windToTextClass(this.lastHourMinimumSpeed)
      : undefined;
  }

  <template>
    <div class="grid gap-2 md:gap-3">
      <div class="min-w-0 w-full aspect-square">
        <WindDirection @data={{@history}} />
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
  </template>
}
