import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { t } from 'ember-intl';
import StationMetricCard from '../metric-card';
import type { History } from 'winds-mobi-client-web/services/store.js';
import WindDirection from '../wind-direction';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';

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
    return this.args.history;
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

    const sortedSpeeds = [...this.lastHourSpeeds].sort((left, right) => {
      return left - right;
    });

    return sortedSpeeds[Math.floor(sortedSpeeds.length / 2)];
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
        <WindDirection @data={{this.lastHourHistory}} />
      </div>

      <dl class="m-0 grid gap-1 md:gap-2">
        <StationMetricCard
          @format="windSpeed"
          @label={{t "wind.maximum"}}
          @value={{this.lastHourMaximumSpeed}}
          @valueClass={{this.lastHourMaximumValueClass}}
        />

        <StationMetricCard
          @format="windSpeed"
          @label={{t "wind.mean"}}
          @value={{this.lastHourMeanSpeed}}
          @valueClass={{this.lastHourMeanValueClass}}
        />

        <StationMetricCard
          @format="windSpeed"
          @label={{t "wind.minimum"}}
          @value={{this.lastHourMinimumSpeed}}
          @valueClass={{this.lastHourMinimumValueClass}}
        />
      </dl>
    </div>
  </template>
}
